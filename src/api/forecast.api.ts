import {api} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";

const {FORECAST} = API_ENDPOINTS;

type Coordinates = {latitude: number; longitude: number};

export type CurrentWeather = {
    time: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    uv_index: number;
    visibility: number;
    dew_point_2m: number;
};

export type HourlySeries = {
    time: number[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: (number | null)[];
    precipitation: number[];
    weather_code: number[];
    is_day: number[];
    wind_speed_10m: number[];
};

export type DailySeries = {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: number[];
    sunset: number[];
    daylight_duration: number[];
    uv_index_max: (number | null)[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
};

type LocationMeta = {
    latitude: number;
    longitude: number;
    timezone: string;
    utc_offset_seconds: number;
    elevation: number;
};

export type ForecastResponse = LocationMeta & {
    current: CurrentWeather;
    hourly: HourlySeries;
    daily: DailySeries;
};

export type CurrentSnapshot = Pick<CurrentWeather, "time" | "temperature_2m" | "weather_code" | "is_day">;
export type CurrentSnapshotResponse = LocationMeta & {current: CurrentSnapshot};

const CURRENT_FIELDS = [
    "temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day", "precipitation", "weather_code", "cloud_cover",
    "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "uv_index", "visibility", "dew_point_2m",
];
const HOURLY_FIELDS = ["temperature_2m", "apparent_temperature", "precipitation_probability", "precipitation", "weather_code", "is_day", "wind_speed_10m"];
const DAILY_FIELDS = [
    "weather_code", "temperature_2m_max", "temperature_2m_min", "sunrise", "sunset", "daylight_duration",
    "uv_index_max", "precipitation_sum", "precipitation_probability_max", "wind_speed_10m_max", "wind_direction_10m_dominant",
];

/** Shared by every call: local time zone of the place and unix timestamps, so no date string ever needs parsing. */
const BASE_PARAMS = {timezone: "auto", timeformat: "unixtime", wind_speed_unit: "kmh"} as const;

export const FORECAST_HOURS = 48;
export const FORECAST_DAYS = 16;

export const getForecast = ({latitude, longitude}: Coordinates) =>
    api.get<ForecastResponse>("forecast", FORECAST, {
        params: {
            ...BASE_PARAMS,
            latitude,
            longitude,
            current: CURRENT_FIELDS.join(","),
            hourly: HOURLY_FIELDS.join(","),
            daily: DAILY_FIELDS.join(","),
            forecast_hours: FORECAST_HOURS,
            past_hours: 0,
            forecast_days: FORECAST_DAYS,
            // Yesterday comes first in `daily`, so the page can say "warmer than yesterday".
            past_days: 1,
        },
    });

/** Current temperature and sky for many places in one request (Open-Meteo accepts comma-separated coordinates). */
export const getCurrentBatch = async (places: Coordinates[]): Promise<CurrentSnapshotResponse[]> => {
    if (places.length === 0) return [];
    const data = await api.get<CurrentSnapshotResponse | CurrentSnapshotResponse[]>("forecast", FORECAST, {
        params: {
            ...BASE_PARAMS,
            latitude: places.map((place) => place.latitude).join(","),
            longitude: places.map((place) => place.longitude).join(","),
            current: "temperature_2m,weather_code,is_day",
        },
    });
    // A single location comes back as an object, several as an array.
    return Array.isArray(data) ? data : [data];
};
