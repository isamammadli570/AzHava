import {useDeferredValue, useEffect, useMemo} from "react";
import {useTranslation} from "react-i18next";
import type {AirQualityCurrent} from "@/api/airQuality.api";
import type {CurrentWeather} from "@/api/forecast.api";
import {STORAGE_KEYS} from "@/constants/storage";
import {ERRORS} from "@/constants/errors";
import {buildAdvice} from "@/helpers/advice";
import {formatClock, localDateKey} from "@/helpers/dates";
import {nextPrecipitation, type DailyPoint, type HourlyPoint} from "@/helpers/forecast";
import {placeRoute, type Place} from "@/helpers/place";
import {dominantCondition, NOTABLE_GUST_KMH} from "@/helpers/summary";
import {seasonFor} from "@/helpers/season";
import {conditionFromCode, sceneFor} from "@/helpers/weather";
import {useGetAirQuality} from "@/hooks/airQuality";
import {useGetForecast} from "@/hooks/forecast";
import {useLanguage} from "@/hooks/useLanguage";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {useRecentPlaces} from "@/hooks/useRecentPlaces";
import {useRenderStages} from "@/hooks/useRenderStages";
import {useRoutePlace} from "@/hooks/useRoutePlace";
import {useLayoutScene} from "@/layout/MainLayout/sceneContext";
import {storageSet} from "@/lib/localStorage";
import {cn} from "@/lib/utils";
import {RouteErrorPage} from "@/router/guards/RouteErrorPage";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {CompactBar, CurrentHero} from "@/pages/WeatherPage/widgets/CurrentHero";
import {AdviceCard} from "@/pages/WeatherPage/widgets/AdviceCard";
import {RadarCard} from "@/pages/WeatherPage/widgets/RadarCard";
import {HourlyForecast} from "@/pages/WeatherPage/widgets/HourlyForecast";
import {DailyForecast} from "@/pages/WeatherPage/widgets/DailyForecast";
import {DetailsGrid} from "@/pages/WeatherPage/widgets/DetailsGrid";
import {DetailSheetHost} from "@/pages/WeatherPage/widgets/DetailSheet";
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
    const {current, hourly, daily, yesterday, timezone, utcOffset} = forecast;

    const weatherCode = current?.weather_code;
    const isDay = current?.is_day === 1;
    const windSpeed = current?.wind_speed_10m ?? 0;
    const observedAt = current?.time;
    const latitude = place?.latitude ?? 0;
    const scene = useMemo(
        () => (weatherCode === undefined || observedAt === undefined ? null : sceneFor(weatherCode, isDay, windSpeed, seasonFor(observedAt, timezone, latitude))),
        [weatherCode, isDay, windSpeed, observedAt, timezone, latitude],
    );
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
                utcOffset={utcOffset}
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
    utcOffset: number;
    air: AirQualityCurrent | undefined;
    isAirLoading: boolean;
    updatedAt: number;
    isRefreshing: boolean;
    isStale: boolean;
    onRefresh: () => void;
};

/**
 * The forecast itself. It stays mounted while the visitor switches cities, so the staged first render (headline,
 * then hourly and tips, then days and radar, then details, a painted frame apart) runs once, and later city changes
 * re-render the heavy sections as an interruptible background update (`useDeferredValue`) while the headline
 * switches at once.
 *
 * Phones get one column; wide screens put the days and the radar in a right-hand column next to the rest.
 */
const WeatherContent = ({place, current, hourly, daily, yesterday, timezone, utcOffset, air, isAirLoading, updatedAt, isRefreshing, isStale, onRefresh}: WeatherContentProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const stage = useRenderStages(4);
    const deferredHourly = useDeferredValue(hourly);
    const deferredDaily = useDeferredValue(daily);
    const deferredCurrent = useDeferredValue(current);
    const deferredPlaceId = useDeferredValue(place.id);
    const today = daily[0];

    // One plain sentence about the hours ahead: rain first if it is coming, else the rest of the day, plus strong gusts.
    const upcoming = nextPrecipitation(hourly);
    const condition = dominantCondition(hourly, (time) => localDateKey(time, timezone)) ?? conditionFromCode(current.weather_code);
    const lead = upcoming
        ? t("hero.precipAt", {time: formatClock(upcoming.time, timezone, locale), chance: upcoming.precipitationProbability})
        : t(`summary.${current.is_day === 1 ? "day" : "night"}.${condition}`);
    const sentence = /[.!?]$/.test(lead) ? lead : `${lead}.`;
    const summary = current.wind_gusts_10m >= NOTABLE_GUST_KMH ? `${sentence} ${t("summary.gusts", {speed: Math.round(current.wind_gusts_10m)})}` : sentence;
    const advice = useMemo(() => buildAdvice({current, today, hours: hourly, aqi: air?.european_aqi ?? null}), [current, today, hourly, air]);

    return (
        <>
            <CompactBar place={place} current={current}/>
            <DetailSheetHost place={place} daily={daily} yesterday={yesterday} timezone={timezone} utcOffset={utcOffset}/>
            <div
                aria-busy={isStale}
                className={cn(
                    "grid grid-cols-[minmax(0,1fr)] gap-3 transition-opacity duration-(--duration-base) [grid-template-areas:'hero'_'advice'_'daily'_'radar'_'details'] sm:gap-4",
                    "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5 lg:[grid-template-areas:'hero_hero'_'daily_radar'_'advice_radar'_'details_details']",
                    isStale && "opacity-60",
                )}
            >
                <CurrentHero
                    place={place}
                    current={current}
                    today={today}
                    yesterday={yesterday}
                    timezone={timezone}
                    updatedAt={updatedAt}
                    isRefreshing={isRefreshing}
                    onRefresh={onRefresh}
                >
                    {stage >= 2 && <HourlyForecast hours={deferredHourly} timezone={timezone} placeId={deferredPlaceId} summary={summary}/>}
                </CurrentHero>
                {stage >= 2 && <AdviceCard advice={advice}/>}
                {stage >= 3 && (
                    <>
                        <DailyForecast days={deferredDaily} timezone={timezone} currentTemp={deferredCurrent.temperature_2m} placeId={deferredPlaceId}/>
                        <RadarCard latitude={place.latitude} longitude={place.longitude} temperature={current.temperature_2m}/>
                    </>
                )}
                {stage >= 4 && (
                    <DetailsGrid
                        current={deferredCurrent}
                        today={deferredDaily[0]}
                        yesterday={yesterday}
                        hours={deferredHourly}
                        timezone={timezone}
                        utcOffset={utcOffset}
                        latitude={place.latitude}
                        longitude={place.longitude}
                        air={air}
                        isAirLoading={isAirLoading}
                    />
                )}
            </div>
        </>
    );
};
