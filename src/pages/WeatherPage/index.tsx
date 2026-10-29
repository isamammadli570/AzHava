import {useDeferredValue, useEffect, useMemo} from "react";
import {useTranslation} from "react-i18next";
import type {AirQualityCurrent} from "@/api/airQuality.api";
import type {CurrentWeather} from "@/api/forecast.api";
import {STORAGE_KEYS} from "@/constants/storage";
import {ERRORS} from "@/constants/errors";
import type {DailyPoint, HourlyPoint} from "@/helpers/forecast";
import {placeRoute, type Place} from "@/helpers/place";
import {sceneFor} from "@/helpers/weather";
import {useGetAirQuality} from "@/hooks/airQuality";
import {useGetForecast} from "@/hooks/forecast";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {useRecentPlaces} from "@/hooks/useRecentPlaces";
import {useRenderStages} from "@/hooks/useRenderStages";
import {useRoutePlace} from "@/hooks/useRoutePlace";
import {useLayoutScene} from "@/layout/MainLayout/sceneContext";
import {storageSet} from "@/lib/localStorage";
import {cn} from "@/lib/utils";
import {RouteErrorPage} from "@/router/guards/RouteErrorPage";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {CurrentHero} from "@/pages/WeatherPage/widgets/CurrentHero";
import {HourlyForecast} from "@/pages/WeatherPage/widgets/HourlyForecast";
import {DailyForecast} from "@/pages/WeatherPage/widgets/DailyForecast";
import {DetailsGrid} from "@/pages/WeatherPage/widgets/DetailsGrid";
import {FavoritesStrip} from "@/pages/WeatherPage/widgets/FavoritesStrip";
import {WeatherPageSkeleton} from "@/pages/WeatherPage/widgets/WeatherPageSkeleton";

/** Current conditions, hourly and daily forecast and details for one place; also paints the sky behind the app. */
export const WeatherPage = () => {
    const {t} = useTranslation();
    const place = useRoutePlace();
    const forecast = useGetForecast(place);
    const air = useGetAirQuality(place);
    const {placeName} = usePlaceLabel();
    const {rememberPlace} = useRecentPlaces();
    const {current, hourly, daily, yesterday, timezone} = forecast;

    const weatherCode = current?.weather_code;
    const isDay = current?.is_day === 1;
    const windSpeed = current?.wind_speed_10m ?? 0;
    const scene = useMemo(() => (weatherCode === undefined ? null : sceneFor(weatherCode, isDay, windSpeed)), [weatherCode, isDay, windSpeed]);
    useLayoutScene(scene);

    useEffect(() => {
        if (!place) return;
        storageSet(STORAGE_KEYS.LAST_PLACE, placeRoute(place));
        rememberPlace(place);
        document.title = `${placeName(place)} · ${t("appName")}`;
    }, [place, placeName, rememberPlace, t]);

    if (!place) return <RouteErrorPage/>;
    if (forecast.isPending) return <WeatherPageSkeleton/>;
    if (!current) return <QueryErrorState message={t(ERRORS.FORECAST)} onRetry={() => void forecast.refetch()}/>;

    const refresh = () => {
        void forecast.refetch();
        void air.refetch();
    };

    return (
        <>
            <FavoritesStrip/>
            <WeatherContent
                place={place}
                current={current}
                hourly={hourly}
                daily={daily}
                yesterday={yesterday}
                timezone={timezone}
                air={air.data?.current}
                isAirLoading={air.isPending}
                updatedAt={forecast.dataUpdatedAt}
                isRefreshing={forecast.isFetching}
                isStale={forecast.isPlaceholderData}
                onRefresh={refresh}
            />
        </>
    );
};

type WeatherContentProps = {
    place: Place;
    current: CurrentWeather;
    hourly: HourlyPoint[];
    daily: DailyPoint[];
    yesterday: DailyPoint | null;
    timezone: string;
    air: AirQualityCurrent | undefined;
    isAirLoading: boolean;
    updatedAt: number;
    isRefreshing: boolean;
    isStale: boolean;
    onRefresh: () => void;
};

/**
 * The forecast itself. It stays mounted while the visitor switches cities, so the staged first render (hero, then
 * hourly, then daily, then details, a painted frame apart) runs once, and later city changes re-render the heavy
 * sections as an interruptible background update (`useDeferredValue`) while the hero switches at once.
 */
const WeatherContent = ({place, current, hourly, daily, yesterday, timezone, air, isAirLoading, updatedAt, isRefreshing, isStale, onRefresh}: WeatherContentProps) => {
    const stage = useRenderStages(4);
    const deferredHourly = useDeferredValue(hourly);
    const deferredDaily = useDeferredValue(daily);
    const deferredCurrent = useDeferredValue(current);
    const deferredPlaceId = useDeferredValue(place.id);

    return (
        <div
            aria-busy={isStale}
            className={cn(
                "grid grid-cols-[minmax(0,1fr)] gap-4 transition-opacity duration-(--duration-base) [grid-template-areas:'hero'_'hourly'_'daily'_'details'] sm:gap-5",
                "lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_auto_1fr] lg:[grid-template-areas:'hero_daily'_'hourly_daily'_'details_daily']",
                isStale && "opacity-60",
            )}
        >
            <CurrentHero
                place={place}
                current={current}
                today={daily[0]}
                yesterday={yesterday}
                hours={hourly}
                timezone={timezone}
                aqi={air?.european_aqi ?? null}
                updatedAt={updatedAt}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
            />
            {stage >= 2 && <HourlyForecast hours={deferredHourly} timezone={timezone} placeId={deferredPlaceId}/>}
            {stage >= 3 && <DailyForecast days={deferredDaily} timezone={timezone} currentTemp={deferredCurrent.temperature_2m} placeId={deferredPlaceId}/>}
            {stage >= 4 && <DetailsGrid current={deferredCurrent} today={deferredDaily[0]} hours={deferredHourly} timezone={timezone} air={air} isAirLoading={isAirLoading}/>}
        </div>
    );
};
