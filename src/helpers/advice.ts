import type {CurrentWeather} from "@/api/forecast.api";
import type {DailyPoint, HourlyPoint} from "@/helpers/forecast";
import {CONDITION, conditionFromCode} from "@/helpers/weather";

export const ADVICE = {
    UMBRELLA: "umbrella",
    SUNSCREEN: "sunscreen",
    BUNDLE_UP: "bundleUp",
    JACKET: "jacket",
    HEAT: "heat",
    WIND: "wind",
    FOG: "fog",
    ICE: "ice",
    AIR: "air",
    STORM: "storm",
    NICE_DAY: "niceDay",
} as const;

export type AdviceId = (typeof ADVICE)[keyof typeof ADVICE];
export type AdviceTone = "warning" | "info" | "good";
export type Advice = {id: AdviceId; tone: AdviceTone};

type AdviceInput = {
    current: CurrentWeather;
    today: DailyPoint | undefined;
    hours: HourlyPoint[];
    aqi: number | null;
};

const MAX_ADVICE = 4;

/**
 * Plain-language tips for the day, most important first: what to take, what to wear, what to watch out for.
 * Falls back to "a nice day" so the section is never empty on calm weather.
 */
export const buildAdvice = ({current, today, hours, aqi}: AdviceInput): Advice[] => {
    const next12 = hours.slice(0, 12);
    const condition = conditionFromCode(current.weather_code);
    const willThunder = next12.some((hour) => conditionFromCode(hour.weatherCode) === CONDITION.THUNDER);
    const wetChance = Math.max(0, ...next12.map((hour) => hour.precipitationProbability));
    const willSnow = next12.some((hour) => conditionFromCode(hour.weatherCode) === CONDITION.SNOW);
    const feels = current.apparent_temperature;
    const advice: Advice[] = [];

    if (condition === CONDITION.THUNDER || willThunder) advice.push({id: ADVICE.STORM, tone: "warning"});
    if (wetChance >= 50 && !willSnow) advice.push({id: ADVICE.UMBRELLA, tone: "warning"});
    if (willSnow || (today && today.min <= 0)) advice.push({id: ADVICE.ICE, tone: "warning"});
    if (current.wind_gusts_10m >= 45) advice.push({id: ADVICE.WIND, tone: "warning"});
    if (aqi !== null && aqi > 60) advice.push({id: ADVICE.AIR, tone: "warning"});
    if (condition === CONDITION.FOG) advice.push({id: ADVICE.FOG, tone: "warning"});
    if (today && today.max >= 32) advice.push({id: ADVICE.HEAT, tone: "warning"});
    if (today && today.uvMax >= 6) advice.push({id: ADVICE.SUNSCREEN, tone: "info"});
    if (feels <= 5) advice.push({id: ADVICE.BUNDLE_UP, tone: "info"});
    else if (feels <= 14) advice.push({id: ADVICE.JACKET, tone: "info"});

    if (advice.length === 0) advice.push({id: ADVICE.NICE_DAY, tone: "good"});
    return advice.slice(0, MAX_ADVICE);
};

export const TEMPERATURE_TREND = {SAME: "same", WARMER: "warmer", COLDER: "colder"} as const;
export type TemperatureTrend = (typeof TEMPERATURE_TREND)[keyof typeof TEMPERATURE_TREND];

/** Today's high against yesterday's, ignoring differences under a degree. */
export const compareWithYesterday = (todayMax: number, yesterdayMax: number): {trend: TemperatureTrend; delta: number} => {
    const delta = Math.round(todayMax - yesterdayMax);
    if (Math.abs(delta) < 1) return {trend: TEMPERATURE_TREND.SAME, delta: 0};
    return {trend: delta > 0 ? TEMPERATURE_TREND.WARMER : TEMPERATURE_TREND.COLDER, delta: Math.abs(delta)};
};
