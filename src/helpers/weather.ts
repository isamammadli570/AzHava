export const CONDITION = {
    CLEAR: "clear",
    PARTLY_CLOUDY: "partlyCloudy",
    CLOUDY: "cloudy",
    FOG: "fog",
    DRIZZLE: "drizzle",
    RAIN: "rain",
    SNOW: "snow",
    THUNDER: "thunder",
} as const;

export type Condition = (typeof CONDITION)[keyof typeof CONDITION];

/** 0 = none, 1 = light, 2 = moderate, 3 = heavy. Drives particle density in the sky and the icon. */
export type Intensity = 0 | 1 | 2 | 3;

/** WMO weather interpretation codes that Open-Meteo returns and that have their own translated label. */
export const WMO_CODES = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99] as const;

const between = (code: number, from: number, to: number): boolean => code >= from && code <= to;

export const conditionFromCode = (code: number): Condition => {
    if (code <= 1) return CONDITION.CLEAR;
    if (code === 2) return CONDITION.PARTLY_CLOUDY;
    if (code === 3) return CONDITION.CLOUDY;
    if (code === 45 || code === 48) return CONDITION.FOG;
    if (between(code, 51, 57)) return CONDITION.DRIZZLE;
    if (between(code, 61, 67) || between(code, 80, 82)) return CONDITION.RAIN;
    if (between(code, 71, 77) || code === 85 || code === 86) return CONDITION.SNOW;
    if (between(code, 95, 99)) return CONDITION.THUNDER;
    return CONDITION.CLOUDY;
};

const LIGHT = new Set([51, 56, 61, 66, 71, 77, 80, 85]);
const MODERATE = new Set([53, 63, 73, 81]);
const HEAVY = new Set([55, 57, 65, 67, 75, 82, 86, 95, 96, 99]);

export const intensityFromCode = (code: number): Intensity => {
    if (HEAVY.has(code)) return 3;
    if (MODERATE.has(code)) return 2;
    if (LIGHT.has(code)) return 1;
    return 0;
};

export type Scene = {condition: Condition; isDay: boolean; intensity: Intensity; isWindy: boolean};

/** Above this sustained speed (km/h) the sky gets wind streaks. */
export const WINDY_KMH = 25;

export const sceneFor = (code: number, isDay: boolean, windSpeed = 0): Scene => ({
    condition: conditionFromCode(code),
    isDay,
    intensity: intensityFromCode(code),
    isWindy: windSpeed >= WINDY_KMH,
});

export const isSameScene = (a: Scene, b: Scene): boolean => a.condition === b.condition && a.isDay === b.isDay && a.intensity === b.intensity && a.isWindy === b.isWindy;

/** Night-time clear sky is the neutral backdrop while nothing is loaded yet. */
export const DEFAULT_SCENE: Scene = {condition: CONDITION.CLEAR, isDay: false, intensity: 0, isWindy: false};

export const SKY_VARIANTS = ["clear", "partlyCloudy", "cloudy", "fog", "rain", "thunder", "snow"] as const;
export type SkyVariant = (typeof SKY_VARIANTS)[number];

/** Drizzle shares the rain sky; everything else has its own. */
export const skyVariant = (condition: Condition): SkyVariant => (condition === CONDITION.DRIZZLE ? "rain" : condition);

/** The class name of the gradient painted behind a scene, defined in `index.css`. */
export const skyClass = (scene: Pick<Scene, "condition" | "isDay">): string => `sky-${skyVariant(scene.condition)}-${scene.isDay ? "day" : "night"}`;

const KNOWN_CODES = new Set<number>(WMO_CODES);

/** i18n key (namespace `weather`) for a WMO code, falling back to the broad condition for unknown codes. */
export const weatherLabelKey = (code: number): string => (KNOWN_CODES.has(code) ? `codes.${code}` : `conditions.${conditionFromCode(code)}`);

export const isWet = (condition: Condition): boolean => condition === CONDITION.DRIZZLE || condition === CONDITION.RAIN || condition === CONDITION.THUNDER;
