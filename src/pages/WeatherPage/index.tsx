import {useEffect, useMemo} from "react";
import {useTranslation} from "react-i18next";
import {STORAGE_KEYS} from "@/constants/storage";
import {ERRORS} from "@/constants/errors";
import {placeRoute} from "@/helpers/place";
import {sceneFor} from "@/helpers/weather";
import {useGetAirQuality} from "@/hooks/airQuality";
import {useGetForecast} from "@/hooks/forecast";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {useRecentPlaces} from "@/hooks/useRecentPlaces";
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

    const today = daily[0];
    const refresh = () => {
        void forecast.refetch();
        void air.refetch();
    };

    return (
        <>
            <FavoritesStrip/>
            <div
                aria-busy={forecast.isPlaceholderData}
                className={cn(
                    "grid grid-cols-[minmax(0,1fr)] gap-4 transition-opacity duration-(--duration-base) [grid-template-areas:'hero'_'hourly'_'daily'_'details'] sm:gap-5",
                    "lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_auto_1fr] lg:[grid-template-areas:'hero_daily'_'hourly_daily'_'details_daily']",
                    forecast.isPlaceholderData && "opacity-60",
                )}
            >
                <CurrentHero
                    place={place}
                    current={current}
                    today={today}
                    yesterday={yesterday}
                    hours={hourly}
                    timezone={timezone}
                    aqi={air.data?.current.european_aqi ?? null}
                    updatedAt={forecast.dataUpdatedAt}
                    isRefreshing={forecast.isFetching}
                    onRefresh={refresh}
                />
                <HourlyForecast hours={hourly} timezone={timezone} placeId={place.id}/>
                <DailyForecast days={daily} timezone={timezone} currentTemp={current.temperature_2m} placeId={place.id}/>
                <DetailsGrid current={current} today={today} hours={hourly} timezone={timezone} air={air.data?.current} isAirLoading={air.isPending}/>
            </div>
        </>
    );
};
