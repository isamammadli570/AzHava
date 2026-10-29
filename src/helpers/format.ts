export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Rounds a temperature without ever showing "-0". */
export const roundTemp = (value: number): number => {
    const rounded = Math.round(value);
    return Object.is(rounded, -0) ? 0 : rounded;
};

export const formatTemp = (value: number | null | undefined): string => (value === null || value === undefined || Number.isNaN(value) ? "—" : `${roundTemp(value)}°`);

export const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

export const compassPoint = (degrees: number): CompassPoint => {
    const normalized = ((degrees % 360) + 360) % 360;
    return COMPASS_POINTS[Math.round(normalized / 45) % COMPASS_POINTS.length];
};

export const UV_LEVEL = {LOW: "low", MODERATE: "moderate", HIGH: "high", VERY_HIGH: "veryHigh", EXTREME: "extreme"} as const;
export type UvLevel = (typeof UV_LEVEL)[keyof typeof UV_LEVEL];

/** WHO UV index bands. */
export const uvLevel = (uv: number): UvLevel => {
    if (uv < 3) return UV_LEVEL.LOW;
    if (uv < 6) return UV_LEVEL.MODERATE;
    if (uv < 8) return UV_LEVEL.HIGH;
    if (uv < 11) return UV_LEVEL.VERY_HIGH;
    return UV_LEVEL.EXTREME;
};

export const AQI_LEVEL = {GOOD: "good", FAIR: "fair", MODERATE: "moderate", POOR: "poor", VERY_POOR: "veryPoor", EXTREMELY_POOR: "extremelyPoor"} as const;
export type AqiLevel = (typeof AQI_LEVEL)[keyof typeof AQI_LEVEL];

/** European Air Quality Index bands (EEA). */
export const aqiLevel = (aqi: number): AqiLevel => {
    if (aqi <= 20) return AQI_LEVEL.GOOD;
    if (aqi <= 40) return AQI_LEVEL.FAIR;
    if (aqi <= 60) return AQI_LEVEL.MODERATE;
    if (aqi <= 80) return AQI_LEVEL.POOR;
    if (aqi <= 100) return AQI_LEVEL.VERY_POOR;
    return AQI_LEVEL.EXTREMELY_POOR;
};

export const PRESSURE_LEVEL = {LOW: "low", NORMAL: "normal", HIGH: "high"} as const;
export type PressureLevel = (typeof PRESSURE_LEVEL)[keyof typeof PRESSURE_LEVEL];

export const pressureLevel = (hpa: number): PressureLevel => {
    if (hpa < 1005) return PRESSURE_LEVEL.LOW;
    if (hpa > 1022) return PRESSURE_LEVEL.HIGH;
    return PRESSURE_LEVEL.NORMAL;
};

/** Share of daylight already gone, 0 before sunrise and 1 after sunset. */
export const dayProgress = (now: number, sunrise: number, sunset: number): number => {
    if (sunset <= sunrise) return 0;
    return clamp((now - sunrise) / (sunset - sunrise), 0, 1);
};

export const splitDuration = (seconds: number): {hours: number; minutes: number} => {
    const totalMinutes = Math.round(Math.max(0, seconds) / 60);
    return {hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60};
};

/** Visibility in kilometres: one decimal below 10 km, whole numbers above. */
export const formatKm = (meters: number): string => {
    const km = Math.max(0, meters) / 1000;
    return km >= 10 ? String(Math.round(km)) : km.toFixed(1);
};

export const formatNumber = (value: number | null | undefined, digits = 0): string =>
    value === null || value === undefined || Number.isNaN(value) ? "—" : value.toFixed(digits);
