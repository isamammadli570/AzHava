import {api} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";

const {AIR_QUALITY} = API_ENDPOINTS;

export const POLLUTANTS = ["pm2_5", "pm10", "ozone", "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide"] as const;
export type Pollutant = (typeof POLLUTANTS)[number];

export type AirQualityCurrent = {time: number; european_aqi: number | null} & Record<Pollutant, number | null>;

export type AirQualityResponse = {
    latitude: number;
    longitude: number;
    timezone: string;
    current: AirQualityCurrent;
};

export const getAirQuality = ({latitude, longitude}: {latitude: number; longitude: number}) =>
    api.get<AirQualityResponse>("airQuality", AIR_QUALITY, {
        params: {
            latitude,
            longitude,
            current: ["european_aqi", ...POLLUTANTS].join(","),
            timezone: "auto",
            timeformat: "unixtime",
        },
    });
