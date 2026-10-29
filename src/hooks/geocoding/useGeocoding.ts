import {useMemo} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {searchPlaces} from "@/api/geocoding.api";
import {ERRORS} from "@/constants/errors";
import {QUERY_KEYS, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH} from "@/constants/other";
import {matchingCity, placeFromGeo, type Place} from "@/helpers/place";
import {loadErrorMeta} from "@/hooks/_shared/queryErrorMeta";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {useLanguage} from "@/hooks/useLanguage";

/** Worldwide place search, debounced. Results that are one of the built-in cities are left out (they are listed already). */
export const useSearchPlaces = (term: string) => {
    const {language} = useLanguage();
    const debounced = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS);
    const isEnabled = debounced.length >= SEARCH_MIN_LENGTH;

    const query = useQuery({
        queryKey: [QUERY_KEYS.GEOCODING, language, debounced],
        queryFn: () => searchPlaces(debounced, language),
        enabled: isEnabled,
        staleTime: Infinity,
        placeholderData: keepPreviousData,
        meta: loadErrorMeta(ERRORS.SEARCH),
    });

    const places = useMemo<Place[]>(
        () => (isEnabled ? (query.data ?? []).filter((result) => !matchingCity(result)).map(placeFromGeo) : []),
        [query.data, isEnabled],
    );

    return {...query, places, isSearching: isEnabled && query.isFetching, isPending: term.trim() !== debounced};
};
