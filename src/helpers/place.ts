import type {GeoResult} from "@/api/geocoding.api";
import {CITIES, type City} from "@/constants/cities";
import {buildRoute} from "@/constants/routes";

/** Anything the app can show weather for: a built-in city (`cityId` set, name translated) or a searched place. */
export type Place = {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    countryCode?: string;
    admin?: string;
    cityId?: string;
};

const coordinateId = (latitude: number, longitude: number): string => `geo:${latitude.toFixed(3)},${longitude.toFixed(3)}`;

export const placeFromCity = (city: City): Place => ({
    id: `city:${city.id}`,
    latitude: city.latitude,
    longitude: city.longitude,
    name: city.id,
    countryCode: city.countryCode,
    cityId: city.id,
});

export const placeFromCoordinates = (latitude: number, longitude: number, name: string, countryCode?: string, admin?: string): Place => ({
    id: coordinateId(latitude, longitude),
    latitude,
    longitude,
    name,
    countryCode,
    admin,
});

export const placeFromGeo = (result: GeoResult): Place =>
    placeFromCoordinates(result.latitude, result.longitude, result.name, result.country_code?.toUpperCase(), result.admin1);

export const placeRoute = (place: Place): string => (place.cityId ? buildRoute.city(place.cityId) : buildRoute.place(place));

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const distanceKm = (a: {latitude: number; longitude: number}, b: {latitude: number; longitude: number}): number => {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** A searched result that is really one of the built-in cities, so search does not list it twice. */
export const matchingCity = (point: {latitude: number; longitude: number}, withinKm = 8): City | undefined =>
    CITIES.find((city) => distanceKm(city, point) <= withinKm);

const isOptionalString = (value: unknown): boolean => value === undefined || typeof value === "string";

/** Validates places read back from localStorage, which may be stale or hand-edited. */
export const isPlace = (value: unknown): value is Place => {
    if (typeof value !== "object" || value === null) return false;
    const place = value as Record<string, unknown>;
    return (
        typeof place.id === "string" &&
        typeof place.name === "string" &&
        typeof place.latitude === "number" &&
        typeof place.longitude === "number" &&
        isOptionalString(place.countryCode) &&
        isOptionalString(place.admin) &&
        isOptionalString(place.cityId)
    );
};
