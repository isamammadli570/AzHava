import {useQuery} from "@tanstack/react-query";
import {getAirQuality} from "@/api/airQuality.api";
import {FORECAST_STALE_TIME, QUERY_KEYS} from "@/constants/other";
import type {Place} from "@/helpers/place";

/**
 * Current European AQI and pollutants. Quiet on failure: the card says "no data" instead of toasting, because
 * missing air-quality coverage is normal for remote places.
 */
export const useGetAirQuality = (place: Place | null) =>
    useQuery({
        queryKey: [QUERY_KEYS.AIR_QUALITY, place ? `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}` : null],
        queryFn: () => getAirQuality(place as Place),
        enabled: place !== null,
        staleTime: FORECAST_STALE_TIME,
        meta: {suppressGlobalError: true},
    });
