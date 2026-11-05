import SunCalc from "suncalc";

export const MOON_PHASES = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"] as const;
export type MoonPhase = (typeof MOON_PHASES)[number];

const SYNODIC_MONTH_DAYS = 29.530588;
const DAY_MS = 86_400_000;

/** Phase is 0 (new) → 0.25 (first quarter) → 0.5 (full) → 0.75 (last quarter) → 1 (new again). */
export const moonPhaseName = (phase: number): MoonPhase => MOON_PHASES[Math.round(phase * 8) % 8];

/** Whole days until the next full moon; 0 when it is full today (within half a day). */
export const daysUntilFullMoon = (phase: number): number => {
    const days = (((0.5 - phase) % 1) + 1) % 1 * SYNODIC_MONTH_DAYS;
    return days < 0.5 || days > SYNODIC_MONTH_DAYS - 0.5 ? 0 : Math.round(days);
};

export type MoonInfo = {phase: number; name: MoonPhase; illumination: number; rise: number | null; set: number | null; daysToFull: number};

/**
 * Moon data for one place and moment. Rise and set are searched within the place's own calendar day
 * (local midnight from its UTC offset), returned as unix seconds, or null when the moon does not rise/set that day.
 */
export const moonInfo = (nowSeconds: number, latitude: number, longitude: number, utcOffsetSeconds: number): MoonInfo => {
    const now = new Date(nowSeconds * 1000);
    const {phase, fraction} = SunCalc.getMoonIllumination(now);

    const localMidnight = Math.floor((nowSeconds + utcOffsetSeconds) / 86_400) * 86_400 - utcOffsetSeconds;
    const windowStart = localMidnight * 1000;
    const windowEnd = windowStart + DAY_MS;
    const events: {rise: number[]; set: number[]} = {rise: [], set: []};
    // The local day can straddle two UTC days, so look at both and keep what falls inside it.
    for (const dayStart of [windowStart - DAY_MS, windowStart, windowStart + DAY_MS]) {
        const times = SunCalc.getMoonTimes(new Date(dayStart), latitude, longitude, true);
        if (times.rise) events.rise.push(times.rise.getTime());
        if (times.set) events.set.push(times.set.getTime());
    }
    const firstInDay = (list: number[]) => {
        const inside = list.filter((time) => time >= windowStart && time < windowEnd).sort((a, b) => a - b);
        return inside.length ? Math.floor(inside[0] / 1000) : null;
    };

    return {phase, name: moonPhaseName(phase), illumination: fraction, rise: firstInDay(events.rise), set: firstInDay(events.set), daysToFull: daysUntilFullMoon(phase)};
};

/**
 * SVG path of the lit part of a moon disc of radius `r` centred at (`c`, `c`), as seen from the northern hemisphere
 * (waxing lit on the right). The terminator is a half-ellipse whose width follows the phase.
 */
export const litMoonPath = (phase: number, c: number, r: number): string => {
    const cos = Math.cos(phase * 2 * Math.PI);
    // Rounded: cos(π/2) is 6e-17, not 0, and would otherwise end up in the path as "6.1e-17".
    const rx = Math.round(Math.abs(cos) * r * 100) / 100;
    const isWaxing = phase < 0.5;
    const isCrescent = cos > 0;
    const outerSweep = isWaxing ? 1 : 0;
    const innerSweep = isWaxing ? (isCrescent ? 0 : 1) : (isCrescent ? 1 : 0);
    return `M${c} ${c - r} A${r} ${r} 0 0 ${outerSweep} ${c} ${c + r} A${rx} ${r} 0 0 ${innerSweep} ${c} ${c - r}Z`;
};

/** Phase (0 new → 0.5 full → 1 new) at a moment. */
export const moonPhaseAt = (unixSeconds: number): number => SunCalc.getMoonIllumination(new Date(unixSeconds * 1000)).phase;

/** Distance from the place to the moon's centre, in kilometres. */
export const moonDistanceKm = (unixSeconds: number, latitude: number, longitude: number): number =>
    SunCalc.getMoonPosition(new Date(unixSeconds * 1000), latitude, longitude).distance;

/** Within this much phase of exactly new or full, a day counts as the new or full moon day (about a day either way). */
const PHASE_DAY = 1 / SYNODIC_MONTH_DAYS;

/** In a list of daily phases, the indices of the new moon and the full moon days (null when the list has none). */
export const findNewAndFull = (phases: number[]): {newMoon: number | null; fullMoon: number | null} => {
    let newMoon: number | null = null;
    let fullMoon: number | null = null;
    phases.forEach((phase, index) => {
        const toNew = Math.min(phase, 1 - phase);
        const toFull = Math.abs(phase - 0.5);
        if (toNew < PHASE_DAY && (newMoon === null || toNew < Math.min(phases[newMoon], 1 - phases[newMoon]))) newMoon = index;
        if (toFull < PHASE_DAY && (fullMoon === null || toFull < Math.abs(phases[fullMoon] - 0.5))) fullMoon = index;
    });
    return {newMoon, fullMoon};
};

/** The next moonrise after a moment (searching four UTC days ahead), or null when there is none (polar regions). */
export const nextMoonrise = (unixSeconds: number, latitude: number, longitude: number): number | null => {
    const dayStart = Math.floor(unixSeconds / 86_400) * 86_400;
    const rises: number[] = [];
    for (let day = 0; day < 4; day++) {
        const {rise} = SunCalc.getMoonTimes(new Date((dayStart + day * 86_400) * 1000), latitude, longitude, true);
        if (rise) rises.push(Math.floor(rise.getTime() / 1000));
    }
    return rises.filter((time) => time > unixSeconds).sort((a, b) => a - b)[0] ?? null;
};

/** How to draw the moon at a moment: light direction and libration (see `MoonDisc`). */
export type MoonView = {
    phase: number;
    /** Unit vector towards the sun in screen space: x right, y up, z towards the viewer. */
    light: [number, number, number];
    /** Optical libration in longitude and latitude, in radians: the slow nodding that shows a little more of one edge. */
    libration: [number, number];
};

const DEG = Math.PI / 180;

/**
 * The moon at a moment, drawn the way iOS Weather does: north always up (it does not spin with the sky over the
 * night, which would swing it left and right as the hours change) and lit straight from the side, as iOS draws it: from
 * the right while waxing, from the left while waning. The phase angle (from the lit fraction) sets how far the light
 * comes from behind; at new and full moon it is straight behind or in front, so switching sides never jumps.
 * Libration uses its dominant terms (the moon's mean anomaly and argument of latitude), signed as the shader turns the
 * sphere (checked against crater positions in iOS Weather), so the face nods slowly and smoothly from day to day.
 */
export const moonView = (unixSeconds: number): MoonView => {
    const date = new Date(unixSeconds * 1000);
    const {fraction, phase} = SunCalc.getMoonIllumination(date);
    const phaseAngle = Math.acos(Math.min(1, Math.max(-1, 2 * fraction - 1)));
    const sideways = Math.sin(phaseAngle);
    const days = unixSeconds / 86_400 - 10_957.5;
    const meanAnomaly = (134.963 + 13.064993 * days) * DEG;
    const argumentOfLatitude = (93.272 + 13.22935 * days) * DEG;
    return {
        phase,
        light: [(phase < 0.5 ? 1 : -1) * sideways, 0, Math.cos(phaseAngle)],
        libration: [6.3 * Math.sin(meanAnomaly) * DEG, -6.7 * Math.sin(argumentOfLatitude) * DEG],
    };
};
