import {useMemo} from "react";
import {useParams, useSearchParams} from "react-router";
import {findCity} from "@/constants/cities";
import {PLACE_QUERY} from "@/constants/routes";
import {placeFromCity, placeFromCoordinates, type Place} from "@/helpers/place";

const parseCoordinate = (value: string | undefined, limit: number): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null;
};

/** The place the current URL points at (`/city/:cityId` or `/place/:lat/:lon`), or null when the URL is invalid. */
export const useRoutePlace = (): Place | null => {
    const {cityId, latitude, longitude} = useParams();
    const [searchParams] = useSearchParams();
    const name = searchParams.get(PLACE_QUERY.NAME);
    const country = searchParams.get(PLACE_QUERY.COUNTRY) ?? undefined;
    const admin = searchParams.get(PLACE_QUERY.ADMIN) ?? undefined;

    return useMemo(() => {
        if (cityId !== undefined) {
            const city = findCity(cityId);
            return city ? placeFromCity(city) : null;
        }
        const lat = parseCoordinate(latitude, 90);
        const lon = parseCoordinate(longitude, 180);
        if (lat === null || lon === null) return null;
        return placeFromCoordinates(lat, lon, name?.trim() || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country, admin);
    }, [cityId, latitude, longitude, name, country, admin]);
};
