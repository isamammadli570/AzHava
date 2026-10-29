import type {DailySeries, HourlySeries} from "@/api/forecast.api";

export type HourlyPoint = {
    time: number;
    temperature: number;
    apparentTemperature: number;
    precipitationProbability: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
    windSpeed: number;
};

export type DailyPoint = {
    time: number;
    weatherCode: number;
    max: number;
    min: number;
    sunrise: number;
    sunset: number;
    daylight: number;
    uvMax: number;
    precipitationSum: number;
    precipitationProbability: number;
    windMax: number;
    windDirection: number;
};

const HOUR = 3600;

/** Turns Open-Meteo's parallel arrays into one object per hour, starting at the hour that contains `now`. */
export const toHourly = (hourly: HourlySeries, now: number): HourlyPoint[] => {
    const firstHour = Math.floor(now / HOUR) * HOUR;
    return hourly.time
        .map((time, index) => ({
            time,
            temperature: hourly.temperature_2m[index],
            apparentTemperature: hourly.apparent_temperature[index],
            precipitationProbability: hourly.precipitation_probability[index] ?? 0,
            precipitation: hourly.precipitation[index] ?? 0,
            weatherCode: hourly.weather_code[index],
            isDay: hourly.is_day[index] === 1,
            windSpeed: hourly.wind_speed_10m[index],
        }))
        .filter((point) => point.time >= firstHour && Number.isFinite(point.temperature));
};

export const toDaily = (daily: DailySeries): DailyPoint[] =>
    daily.time
        .map((time, index) => ({
            time,
            weatherCode: daily.weather_code[index],
            max: daily.temperature_2m_max[index],
            min: daily.temperature_2m_min[index],
            sunrise: daily.sunrise[index],
            sunset: daily.sunset[index],
            daylight: daily.daylight_duration[index],
            uvMax: daily.uv_index_max[index] ?? 0,
            precipitationSum: daily.precipitation_sum[index] ?? 0,
            precipitationProbability: daily.precipitation_probability_max[index] ?? 0,
            windMax: daily.wind_speed_10m_max[index],
            windDirection: daily.wind_direction_10m_dominant[index],
        }))
        .filter((day) => Number.isFinite(day.max) && Number.isFinite(day.min));

/** Splits days into the one before today (by the place's own calendar) and today onwards. */
export const splitYesterday = (days: DailyPoint[], dayKeyOf: (time: number) => string, todayKey: string): {yesterday: DailyPoint | null; days: DailyPoint[]} => {
    const past = days.filter((day) => dayKeyOf(day.time) < todayKey);
    return {yesterday: past[past.length - 1] ?? null, days: days.filter((day) => dayKeyOf(day.time) >= todayKey)};
};

/** Lowest and highest temperature across days, used to place every day's range bar on one shared scale. */
export const temperatureBounds = (days: DailyPoint[]): {min: number; max: number} => {
    if (days.length === 0) return {min: 0, max: 0};
    return {min: Math.min(...days.map((day) => day.min)), max: Math.max(...days.map((day) => day.max))};
};

/** First upcoming hour where precipitation is likely, or null when the window stays dry. */
export const nextPrecipitation = (hours: HourlyPoint[], windowHours = 12, threshold = 50): HourlyPoint | null =>
    hours.slice(0, windowHours).find((hour) => hour.precipitationProbability >= threshold) ?? null;

export const precipitationTotal = (hours: HourlyPoint[]): number => hours.reduce((sum, hour) => sum + hour.precipitation, 0);
