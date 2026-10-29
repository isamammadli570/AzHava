const read = (value: string | undefined, fallback: string): string => (value?.trim() ? value.trim() : fallback).replace(/\/+$/, "");

/** Open-Meteo is public and keyless, so every host has a working default; the env only overrides it (self-hosting). */
export const ENV = {
    forecastApi: read(import.meta.env.VITE_FORECAST_API, "https://api.open-meteo.com"),
    airQualityApi: read(import.meta.env.VITE_AIR_QUALITY_API, "https://air-quality-api.open-meteo.com"),
    geocodingApi: read(import.meta.env.VITE_GEOCODING_API, "https://geocoding-api.open-meteo.com"),
} as const;
