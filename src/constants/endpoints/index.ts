/** Every Open-Meteo path the app calls. The host for each lives in `ENV`. */
export const API_ENDPOINTS = {
    FORECAST: "/v1/forecast",
    AIR_QUALITY: "/v1/air-quality",
    GEOCODING_SEARCH: "/v1/search",
} as const;
