export const CITY_REGION = {
    AZERBAIJAN: "az",
    WORLD: "world",
} as const;

export type CityRegion = (typeof CITY_REGION)[keyof typeof CITY_REGION];

export type City = {
    id: string;
    latitude: number;
    longitude: number;
    countryCode: string;
    region: CityRegion;
};

const az = (id: string, latitude: number, longitude: number): City => ({id, latitude, longitude, countryCode: "AZ", region: CITY_REGION.AZERBAIJAN});
const world = (id: string, latitude: number, longitude: number, countryCode: string): City => ({id, latitude, longitude, countryCode, region: CITY_REGION.WORLD});

/** Built-in cities. Their names are translated in the `cities` namespace under the same id. */
export const CITIES: readonly City[] = [
    az("baku", 40.4093, 49.8671),
    az("ganja", 40.6828, 46.3606),
    az("sumgait", 40.5897, 49.6686),
    az("mingachevir", 40.7703, 47.0496),
    az("shaki", 41.1919, 47.1706),
    az("lankaran", 38.7529, 48.8475),
    az("quba", 41.3611, 48.5134),
    az("gabala", 40.9814, 47.8458),
    az("shusha", 39.7583, 46.7486),
    az("khankendi", 39.8153, 46.7519),
    az("nakhchivan", 39.2089, 45.4122),
    az("shamakhi", 40.6314, 48.6364),
    az("shirvan", 39.9317, 48.9203),
    az("yevlakh", 40.6183, 47.15),
    az("zagatala", 41.6316, 46.6433),
    az("gusar", 41.4275, 48.4302),
    az("lerik", 38.7736, 48.4151),
    az("lachin", 39.6383, 46.5461),
    world("istanbul", 41.0082, 28.9784, "TR"),
    world("ankara", 39.9334, 32.8597, "TR"),
    world("tbilisi", 41.7151, 44.8271, "GE"),
    world("moscow", 55.7558, 37.6173, "RU"),
    world("dubai", 25.2048, 55.2708, "AE"),
    world("london", 51.5074, -0.1278, "GB"),
    world("paris", 48.8566, 2.3522, "FR"),
    world("berlin", 52.52, 13.405, "DE"),
    world("new-york", 40.7128, -74.006, "US"),
    world("tokyo", 35.6762, 139.6503, "JP"),
];

export const DEFAULT_CITY_ID = "baku";

export const findCity = (cityId: string | undefined): City | undefined => CITIES.find((city) => city.id === cityId);
