export const QUERY_KEYS = {
    FORECAST: "forecast",
    CURRENT_BATCH: "current-batch",
    AIR_QUALITY: "air-quality",
    GEOCODING: "geocoding",
    RADAR: "radar",
    HOURLY_DETAIL: "hourly-detail",
    GRID: "grid-weather",
} as const;

/** Forecast data changes every 15 minutes upstream; refetching more often only burns the free quota. */
export const FORECAST_STALE_TIME = 10 * 60_000;

export const HOURLY_RANGES = [24, 48] as const;
export type HourlyRange = (typeof HOURLY_RANGES)[number];

export const DAILY_RANGES = [7, 16] as const;
export type DailyRange = (typeof DAILY_RANGES)[number];

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_RESULT_LIMIT = 8;

/** One lightning cycle in seconds; the hero bolt and the sky flash share it (and `.gs-bolt`/`.sky-lightning` in index.css). */
export const LIGHTNING_PERIOD_S = 9;
