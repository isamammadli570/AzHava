import {useEffect, useMemo} from "react";
import {useTranslation} from "react-i18next";
import {CITIES, CITY_REGION, DEFAULT_CITY_ID} from "@/constants/cities";
import {ERRORS} from "@/constants/errors";
import {placeFromCity, type Place} from "@/helpers/place";
import {sceneFor} from "@/helpers/weather";
import {useGetCurrentBatch, usePrefetchForecast} from "@/hooks/forecast";
import {useFavorites} from "@/hooks/useFavorites";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {useRenderStages} from "@/hooks/useRenderStages";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {useLayoutScene} from "@/layout/MainLayout/sceneContext";
import {PageTitle} from "@/widgets/PageTitle";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {CityTile} from "@/pages/CitiesPage/widgets/CityTile";
import {staggerIndex} from "@/lib/utils";

const AZ_PLACES = CITIES.filter((city) => city.region === CITY_REGION.AZERBAIJAN).map(placeFromCity);
const WORLD_PLACES = CITIES.filter((city) => city.region === CITY_REGION.WORLD).map(placeFromCity);
const BAKU_ID = `city:${DEFAULT_CITY_ID}`;

/** Every built-in city (and favourites) at a glance, fetched in one batched request. */
export const CitiesPage = () => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const {placeName, countryName} = usePlaceLabel();
    const {favorites} = useFavorites();
    const now = useNow();

    const places = useMemo(() => {
        const unique = new Map<string, Place>();
        [...favorites, ...AZ_PLACES, ...WORLD_PLACES].forEach((place) => unique.set(place.id, place));
        return [...unique.values()];
    }, [favorites]);

    const {byPlaceId, isError, data, refetch} = useGetCurrentBatch(places);
    const prefetchForecast = usePrefetchForecast();

    const bakuNow = byPlaceId.get(BAKU_ID)?.current;
    const scene = useMemo(() => (bakuNow ? sceneFor(bakuNow.weather_code, bakuNow.is_day === 1) : null), [bakuNow]);
    useLayoutScene(scene);

    useEffect(() => {
        document.title = `${t("citiesPage.title")} · ${t("common:appName")}`;
    }, [t]);

    // The world section (below the first screen) is added a painted frame later, so opening the page is one short frame.
    const stage = useRenderStages(2);
    const sections = [
        {id: "favorites", title: t("common:favorites.title"), places: favorites},
        {id: "az", title: t("citiesPage.azerbaijan"), places: AZ_PLACES},
        {id: "world", title: t("citiesPage.world"), places: stage >= 2 ? WORLD_PLACES : []},
    ].filter((section) => section.places.length > 0);

    return (
        <div className="space-y-8">
            <PageTitle title={t("citiesPage.title")} description={t("citiesPage.description")}/>
            {isError && !data ? (
                <QueryErrorState message={t(ERRORS.FORECAST)} onRetry={() => void refetch()}/>
            ) : (
                sections.map((section) => (
                    <section key={section.id} aria-labelledby={`section-${section.id}`}>
                        <h2 id={`section-${section.id}`} className="section-label mb-3">{section.title}</h2>
                        <ul className="stagger grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] sm:gap-4">
                            {section.places.map((place, index) => (
                                <CityTile
                                    key={place.id}
                                    place={place}
                                    name={placeName(place)}
                                    country={place.countryCode === "AZ" ? place.admin : countryName(place)}
                                    snapshot={byPlaceId.get(place.id)}
                                    now={now}
                                    locale={locale}
                                    onIntent={prefetchForecast}
                                    style={staggerIndex(index)}
                                />
                            ))}
                        </ul>
                    </section>
                ))
            )}
        </div>
    );
};
