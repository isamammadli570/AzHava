import {CloudRain, Equal, MapPin, RefreshCw, Sun, TrendingDown, TrendingUp} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {CurrentWeather} from "@/api/forecast.api";
import {buildAdvice, compareWithYesterday, TEMPERATURE_TREND} from "@/helpers/advice";
import {formatClock, formatDayMonth, formatFullDate} from "@/helpers/dates";
import {formatTemp} from "@/helpers/format";
import {nextPrecipitation, type DailyPoint, type HourlyPoint} from "@/helpers/forecast";
import type {Place} from "@/helpers/place";
import {weatherLabelKey} from "@/helpers/weather";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {useOnlineStatus} from "@/hooks/useOnlineStatus";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {Button} from "@/components/ui/button";
import {AnimatedNumber} from "@/widgets/AnimatedNumber";
import {FavoriteButton} from "@/widgets/FavoriteButton";
import {WeatherIcon} from "@/widgets/WeatherIcon";
import {AdviceList} from "@/pages/WeatherPage/widgets/CurrentHero/AdviceList";
import {cn} from "@/lib/utils";

const TREND_ICON = {[TEMPERATURE_TREND.SAME]: Equal, [TEMPERATURE_TREND.WARMER]: TrendingUp, [TEMPERATURE_TREND.COLDER]: TrendingDown};
const TREND_CLASS = {[TEMPERATURE_TREND.SAME]: "text-muted-foreground", [TEMPERATURE_TREND.WARMER]: "text-warning", [TEMPERATURE_TREND.COLDER]: "text-accent"};

type CurrentHeroProps = {
    place: Place;
    current: CurrentWeather;
    today: DailyPoint | undefined;
    yesterday: DailyPoint | null;
    hours: HourlyPoint[];
    timezone: string;
    aqi: number | null;
    updatedAt: number;
    isRefreshing: boolean;
    onRefresh: () => void;
};

/**
 * The headline: where, local time, the big temperature with its animated icon, a comparison with yesterday,
 * a one-line outlook and plain-language tips for the day.
 */
export const CurrentHero = ({place, current, today, yesterday, hours, timezone, aqi, updatedAt, isRefreshing, onRefresh}: CurrentHeroProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const {placeName, countryName} = usePlaceLabel();
    const now = useNow();
    const isDay = current.is_day === 1;
    const condition = t(weatherLabelKey(current.weather_code));
    const upcoming = nextPrecipitation(hours);
    const subtitle = [place.admin, countryName(place)].filter(Boolean).join(", ");
    const comparison = today && yesterday ? compareWithYesterday(today.max, yesterday.max) : null;
    const TrendIcon = comparison ? TREND_ICON[comparison.trend] : null;
    const minutesAgo = Math.max(0, Math.floor((now * 1000 - updatedAt) / 60_000));
    const advice = buildAdvice({current, today, hours, aqi});
    const isOnline = useOnlineStatus();

    return (
        <section aria-labelledby="hero-title" className="glass spotlight relative overflow-hidden rounded-[2rem] p-5 sm:p-8 [grid-area:hero]">
            <div aria-hidden className={cn("pointer-events-none absolute -top-24 -right-24 size-80 rounded-full blur-3xl transition-colors duration-(--duration-sky)", isDay ? "bg-brand/15" : "bg-accent/10")}/>
            <div key={place.id} className="relative animate-fade-up">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 id="hero-title" className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-shadow-soft [view-transition-name:place-title] sm:text-4xl">
                            <MapPin className="size-6 shrink-0 text-brand sm:size-7" aria-hidden/>
                            <span className="truncate">{placeName(place)}</span>
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground first-letter:uppercase">
                            {subtitle && <span className="mr-1.5">{subtitle} ·</span>}
                            {formatFullDate(now, timezone, locale)} · <span className="tabular">{formatClock(now, timezone, locale)}</span>
                        </p>
                    </div>
                    <FavoriteButton place={place}/>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-8 sm:gap-x-10">
                    <WeatherIcon code={current.weather_code} isDay={isDay} size={112} className="-my-2 animate-float sm:size-40"/>
                    <div className="min-w-[8.5rem] flex-1">
                        <p className="flex items-start font-display leading-none font-extralight tracking-tighter text-shadow-soft" aria-label={formatTemp(current.temperature_2m)}>
                            <AnimatedNumber value={current.temperature_2m} className="text-[5.5rem] sm:text-[8rem]"/>
                            <span className="mt-2 text-5xl font-light text-muted-foreground sm:mt-4 sm:text-6xl">°</span>
                        </p>
                        <p className="mt-1 text-xl font-semibold sm:text-2xl">{condition}</p>
                    </div>
                </div>

                <div className="stagger mt-6 flex flex-wrap gap-2 text-sm">
                    {today && (
                        <>
                            <span className="rounded-full bg-white/10 px-3 py-1.5 tabular">{t("hero.high", {temp: formatTemp(today.max)})}</span>
                            <span className="rounded-full bg-white/10 px-3 py-1.5 tabular">{t("hero.low", {temp: formatTemp(today.min)})}</span>
                        </>
                    )}
                    <span className="rounded-full bg-white/10 px-3 py-1.5 tabular">{t("hero.feelsLike", {temp: formatTemp(current.apparent_temperature)})}</span>
                    {comparison && TrendIcon && (
                        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                            <TrendIcon className={cn("size-4", TREND_CLASS[comparison.trend])} aria-hidden/>
                            {t(`hero.yesterday.${comparison.trend}`, {delta: comparison.delta})}
                        </span>
                    )}
                </div>

                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    {upcoming ? <CloudRain className="size-4 shrink-0 text-accent" aria-hidden/> : <Sun className="size-4 shrink-0 text-brand" aria-hidden/>}
                    {upcoming ? t("hero.precipAt", {time: formatClock(upcoming.time, timezone, locale), chance: upcoming.precipitationProbability}) : t("hero.dry")}
                </p>

                <AdviceList advice={advice}/>

                <div className="mt-5 flex items-center justify-end gap-2 text-xs text-subtle-foreground">
                    {/* Offline, the data may be hours old (served from the app's cache), so show when it is from. */}
                    <span aria-live="polite" className={cn(!isOnline && "text-warning")}>
                        {!isOnline
                            ? t("common:lastData", {time: `${formatDayMonth(current.time, timezone, locale)}, ${formatClock(current.time, timezone, locale)}`})
                            : minutesAgo < 1 ? t("common:updatedJustNow") : t("common:updatedAgo", {count: minutesAgo})}
                    </span>
                    <Button variant="ghost" size="icon-sm" onClick={onRefresh} disabled={isRefreshing || !isOnline} aria-label={t("common:refresh")} title={t("common:refresh")}>
                        <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")}/>
                    </Button>
                </div>
            </div>
        </section>
    );
};
