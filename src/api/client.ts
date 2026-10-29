import axios, {type AxiosInstance, type AxiosRequestConfig} from "axios";
import i18n from "@/i18n";
import {ENV} from "@/lib/env";
import {ERRORS} from "@/constants/errors";

export type RequestConfig = AxiosRequestConfig;

/** One error shape for every failed request, so the UI never has to know about axios. */
export class ApiError extends Error {
    readonly status: number | null;
    readonly isNetworkError: boolean;
    readonly url: string | undefined;

    constructor(message: string, {status = null, isNetworkError = false, url}: {status?: number | null; isNetworkError?: boolean; url?: string}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.isNetworkError = isNetworkError;
        this.url = url;
    }
}

/** Open-Meteo reports bad requests as `{error: true, reason: "..."}`. */
const readReason = (data: unknown): string | null => {
    if (typeof data !== "object" || data === null || !("reason" in data)) return null;
    const {reason} = data as {reason: unknown};
    return typeof reason === "string" ? reason : null;
};

export const normalizeApiError = (error: unknown): ApiError => {
    if (error instanceof ApiError) return error;
    if (!axios.isAxiosError(error)) return new ApiError(i18n.t(ERRORS.LOAD), {});

    const url = error.config?.url;
    if (!error.response) return new ApiError(i18n.t(ERRORS.NETWORK), {isNetworkError: true, url});
    return new ApiError(readReason(error.response.data) ?? i18n.t(ERRORS.LOAD), {status: error.response.status, url});
};

const createClient = (baseURL: string): AxiosInstance => {
    const client = axios.create({baseURL, timeout: 15_000});
    client.interceptors.response.use(undefined, (error: unknown) => Promise.reject(normalizeApiError(error)));
    return client;
};

const clients = {
    forecast: createClient(ENV.forecastApi),
    airQuality: createClient(ENV.airQualityApi),
    geocoding: createClient(ENV.geocodingApi),
} as const;

export type ApiService = keyof typeof clients;

/** Open-Meteo answers with the payload itself (no envelope), so `get` just returns `data`. */
export const api = {
    get: async <TData>(service: ApiService, url: string, config?: RequestConfig) => (await clients[service].get<TData>(url, config)).data,
};
