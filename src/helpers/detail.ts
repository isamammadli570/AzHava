import type {HourlyDetailSeries} from "@/api/forecast.api";
import {localDateKey} from "@/helpers/dates";

/** One hour with every reading the detail sheets need. */
export type DetailHour = {
    time: number;
    temperature: number;
    apparentTemperature: number;
    precipitationProbability: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    uv: number;
    humidity: number;
    dewPoint: number;
    /** Kilometres. */
    visibility: number;
    pressure: number;
};

export const toDetailHours = (hourly: HourlyDetailSeries): DetailHour[] =>
    hourly.time
        .map((time, index) => ({
            time,
            temperature: hourly.temperature_2m[index],
            apparentTemperature: hourly.apparent_temperature[index],
            precipitationProbability: hourly.precipitation_probability[index] ?? 0,
            precipitation: hourly.precipitation[index] ?? 0,
            weatherCode: hourly.weather_code[index],
            isDay: hourly.is_day[index] === 1,
            windSpeed: hourly.wind_speed_10m[index],
            windGusts: hourly.wind_gusts_10m[index],
            windDirection: hourly.wind_direction_10m[index],
            uv: hourly.uv_index[index] ?? 0,
            humidity: hourly.relative_humidity_2m[index],
            dewPoint: hourly.dew_point_2m[index],
            visibility: (hourly.visibility[index] ?? 0) / 1000,
            pressure: hourly.pressure_msl[index],
        }))
        .filter((hour) => Number.isFinite(hour.temperature));

/** The hours of one calendar day (YYYY-MM-DD in the place's time zone). */
export const hoursOfDay = (hours: DetailHour[], dayKey: string, timeZone: string): DetailHour[] =>
    hours.filter((hour) => localDateKey(hour.time, timeZone) === dayKey);

export type Peak = {time: number; value: number};

/** The highest (or, with `lowest`, the lowest) reading of the hours and when it happens; the earliest wins a tie. */
export const peakOf = (hours: DetailHour[], pick: (hour: DetailHour) => number, lowest = false): Peak | null => {
    let best: Peak | null = null;
    for (const hour of hours) {
        const value = pick(hour);
        if (!Number.isFinite(value)) continue;
        if (!best || (lowest ? value < best.value : value > best.value)) best = {time: hour.time, value};
    }
    return best;
};

export const sumOf = (hours: DetailHour[], pick: (hour: DetailHour) => number): number => hours.reduce((total, hour) => total + (pick(hour) || 0), 0);

export const TREND = {RISING: "rising", FALLING: "falling", STEADY: "steady"} as const;
export type Trend = (typeof TREND)[keyof typeof TREND];

/** Whether a reading ends the day noticeably higher or lower than it started. */
export const trendOf = (first: number, last: number, threshold: number): Trend => {
    if (last - first >= threshold) return TREND.RISING;
    if (first - last >= threshold) return TREND.FALLING;
    return TREND.STEADY;
};

/** Upper bounds (km/h, exclusive) of Beaufort forces 0–11; anything faster is force 12. */
const BEAUFORT_LIMITS = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];

export const BEAUFORT_LEVELS = BEAUFORT_LIMITS.length + 1;

export const beaufortForce = (kmh: number): number => {
    const index = BEAUFORT_LIMITS.findIndex((limit) => kmh < limit);
    return index === -1 ? BEAUFORT_LIMITS.length : index;
};

/** The speed range of a force, as printed in the table ("< 1", "1–5", …, "≥ 118"). */
export const beaufortRange = (force: number): string => {
    if (force === 0) return `< ${BEAUFORT_LIMITS[0]}`;
    if (force >= BEAUFORT_LIMITS.length) return `≥ ${BEAUFORT_LIMITS[BEAUFORT_LIMITS.length - 1]}`;
    return `${BEAUFORT_LIMITS[force - 1]}–${BEAUFORT_LIMITS[force] - 1}`;
};

/** Calm teal through green and yellow to storm red, one colour per force. */
export const beaufortColor = (force: number): string => {
    const hue = 175 - (force / (BEAUFORT_LEVELS - 1)) * 175;
    return `hsl(${Math.round(hue)} 70% 58%)`;
};
