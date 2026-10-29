import {useCallback, useMemo} from "react";
import {keepPreviousData, queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {getCurrentBatch, getForecast, type CurrentSnapshotResponse, type ForecastResponse} from "@/api/forecast.api";
import {ERRORS} from "@/constants/errors";
import {FORECAST_STALE_TIME, QUERY_KEYS} from "@/constants/other";
import {localDateKey} from "@/helpers/dates";
import {splitYesterday, toDaily, toHourly} from "@/helpers/forecast";
import type {Place} from "@/helpers/place";
import {loadErrorMeta} from "@/hooks/_shared/queryErrorMeta";

type Coordinates = Pick<Place, "latitude" | "longitude">;

const coordinatesKey = (place: Coordinates) => `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`;

const NO_DAYS = {yesterday: null, days: []};

/** Yesterday (by the place's own calendar) apart from today onwards. */
const splitDays = (data: ForecastResponse) => {
    const dayKeyOf = (time: number) => localDateKey(time, data.timezone);
    return splitYesterday(toDaily(data.daily), dayKeyOf, dayKeyOf(data.current.time));
};

/** Shared by the page query and by hover prefetching, so a prefetched forecast is exactly the one the page reads. */
export const forecastQueryOptions = (place: Coordinates) =>
    queryOptions({
        queryKey: [QUERY_KEYS.FORECAST, coordinatesKey(place)],
        queryFn: () => getForecast(place),
        staleTime: FORECAST_STALE_TIME,
    });

/**
 * Full forecast for one place: current conditions, the next 48 hours, yesterday for comparison and up to 16 days,
 * already reshaped into rows. The previous place stays on screen while the next one loads, so switching cities
 * cross-fades instead of flashing.
 */
export const useGetForecast = (place: Place | null) => {
    const query = useQuery({
        ...forecastQueryOptions(place ?? {latitude: 0, longitude: 0}),
        enabled: place !== null,
        refetchInterval: FORECAST_STALE_TIME,
        placeholderData: keepPreviousData,
        meta: loadErrorMeta(ERRORS.FORECAST),
    });

    const {data} = query;
    const hourly = useMemo(() => (data ? toHourly(data.hourly, data.current.time) : []), [data]);
    const {yesterday, days} = useMemo(() => (data ? splitDays(data) : NO_DAYS), [data]);

    return {...query, current: data?.current, timezone: data?.timezone ?? "UTC", hourly, daily: days, yesterday};
};

/** Warms the forecast of a place the pointer is resting on, so opening it feels instant. */
export const usePrefetchForecast = () => {
    const queryClient = useQueryClient();
    return useCallback((place: Coordinates) => void queryClient.prefetchQuery(forecastQueryOptions(place)), [queryClient]);
};

/** Current temperature and sky for a list of places in one request; pass a memoised array (results keep its order). */
export const useGetCurrentBatch = (places: Place[]) => {
    const key = places.map(coordinatesKey).join("|");

    const query = useQuery({
        queryKey: [QUERY_KEYS.CURRENT_BATCH, key],
        queryFn: () => getCurrentBatch(places),
        enabled: places.length > 0,
        staleTime: FORECAST_STALE_TIME,
        placeholderData: keepPreviousData,
        meta: loadErrorMeta(ERRORS.FORECAST),
    });

    const byPlaceId = useMemo(() => {
        const map = new Map<string, CurrentSnapshotResponse>();
        query.data?.forEach((snapshot, index) => {
            const place = places[index];
            if (place) map.set(place.id, snapshot);
        });
        return map;
    }, [query.data, places]);

    return {...query, byPlaceId};
};
