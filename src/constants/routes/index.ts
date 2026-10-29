export const ROUTES = {
    ROOT: "/",
    CITIES: "/cities",
    CITY: "/city/:cityId",
    PLACE: "/place/:latitude/:longitude",
} as const;

export const PLACE_QUERY = {
    NAME: "name",
    COUNTRY: "country",
    ADMIN: "admin",
} as const;

type PlaceRouteInput = {latitude: number; longitude: number; name: string; countryCode?: string; admin?: string};

const coordinate = (value: number): string => value.toFixed(4);

export const buildRoute = {
    city: (cityId: string) => `/city/${encodeURIComponent(cityId)}`,
    place: ({latitude, longitude, name, countryCode, admin}: PlaceRouteInput) => {
        const query = new URLSearchParams({[PLACE_QUERY.NAME]: name});
        if (countryCode) query.set(PLACE_QUERY.COUNTRY, countryCode);
        if (admin) query.set(PLACE_QUERY.ADMIN, admin);
        return `/place/${coordinate(latitude)}/${coordinate(longitude)}?${query.toString()}`;
    },
};
