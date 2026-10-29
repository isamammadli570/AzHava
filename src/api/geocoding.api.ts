import {api} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {SEARCH_RESULT_LIMIT} from "@/constants/other";

const {GEOCODING_SEARCH} = API_ENDPOINTS;

export type GeoResult = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country_code?: string;
    country?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
};

type GeoSearchResponse = {results?: GeoResult[]};

export const searchPlaces = async (name: string, language: string): Promise<GeoResult[]> => {
    const data = await api.get<GeoSearchResponse>("geocoding", GEOCODING_SEARCH, {
        params: {name, language, count: SEARCH_RESULT_LIMIT, format: "json"},
    });
    return data.results ?? [];
};
