import type {ReactNode} from "react";
import {Droplet, RefreshCw, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {CurrentWeather} from "@/api/forecast.api";
import {compareWithYesterday} from "@/helpers/advice";
import {formatClock, formatDayMonth, formatWeekday, localDateKey} from "@/helpers/dates";
import {compassPoint, formatTemp, roundTemp} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import type {Place} from "@/helpers/place";
import {conditionFromCode, intensityFromCode, WINDY_KMH, weatherLabelKey} from "@/helpers/weather";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {useOnlineStatus} from "@/hooks/useOnlineStatus";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {AnimatedNumber} from "@/widgets/AnimatedNumber";
import {FavoriteButton} from "@/widgets/FavoriteButton";
import {GlassScene} from "@/widgets/GlassScene";
import {cn} from "@/lib/utils";

type StatRowProps = {icon: ReactNode; label: string; value: ReactNode; detail?: string};

/** One reading under the temperature: thin icon, tiny spaced label, the value in light weight. */
const StatRow = ({icon, label, value, detail}: StatRowProps) => (
    <div className="flex items-start gap-3 py-3.5">
        <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
        <div className="min-w-0">
            <p className="text-[10px] font-light tracking-[0.28em] text-muted-foreground uppercase">{label}</p>
            <p className="mt-1.5 text-[15px] font-light tracking-[0.12em] tabular">{value}</p>
            {detail && <p className="text-[15px] font-light tracking-[0.12em] text-muted-foreground">{detail}</p>}
        </div>
    </div>
);

type CurrentHeroProps = {
    place: Place;
    current: CurrentWeather;
    today: DailyPoint | undefined;
    yesterday: DailyPoint | null;
    timezone: string;
    updatedAt: number;
    isRefreshing: boolean;
    onRefresh: () => void;
    /** The hourly strip, shown between the headline and the date bar like on an instrument panel. */
    children?: ReactNode;
};

/**
 * The night-glass headline: the temperature in hairline type with the condition in spaced capitals and two readings
 * on the left, the weather as a glass sculpture on the right, then the hourly strip and a weekday · time · date bar.
 * The top part fades and lifts away on scroll (`.hero-collapse`), handing over to the compact bar.
 */
export const CurrentHero = ({place, current, today, yesterday, timezone, updatedAt, isRefreshing, onRefresh, children}: CurrentHeroProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const {placeName, countryName} = usePlaceLabel();
    const now = useNow();
    const isOnline = useOnlineStatus();
    const isDay = current.is_day === 1;
    const country = countryName(place);
    const comparison = today && yesterday ? compareWithYesterday(today.max, yesterday.max) : null;
    const minutesAgo = Math.max(0, Math.floor((now * 1000 - updatedAt) / 60_000));
    const status = !isOnline
        ? t("common:lastData", {time: `${formatDayMonth(current.time, timezone, locale)}, ${formatClock(current.time, timezone, locale)}`})
        : minutesAgo < 1 ? t("common:updatedJustNow") : t("common:updatedAgo", {count: minutesAgo});
    // The date line reads "30 OCT 2026" in every language, with the month as the locale writes it.
    const [year] = localDateKey(now, timezone).split("-");

    return (
        <section aria-labelledby="hero-title" className="relative [grid-area:hero]">
            <div className="hero-collapse relative min-h-[27rem] sm:min-h-[30rem] lg:min-h-[35rem]">
                <div key={place.id} className="relative z-10 flex w-[52%] animate-fade-up flex-col pt-2 sm:w-[45%] sm:pt-6 lg:w-[38%]">
                    <h1 id="hero-title" className="truncate text-[11px] font-light tracking-[0.34em] text-muted-foreground uppercase">
                        {placeName(place)}
                        {country && <span className="hidden sm:inline"> · {country}</span>}
                    </h1>
                    <p className="mt-5 flex items-start leading-[0.8] font-extralight tracking-tight" aria-label={formatTemp(current.temperature_2m)}>
                        <AnimatedNumber value={current.temperature_2m} className="text-[6.5rem] sm:text-[9rem]"/>
                        <span className="mt-1 text-[3rem] font-extralight sm:text-[4rem]">°</span>
                    </p>
                    <p className="label-spaced mt-6 text-[13px] sm:text-sm">{t(weatherLabelKey(current.weather_code))}</p>
                    {today && (
                        <p className="mt-2 text-[11px] font-light tracking-[0.22em] text-muted-foreground uppercase tabular">
                            {t("hero.high", {temp: formatTemp(today.max)})} · {t("hero.low", {temp: formatTemp(today.min)})}
                        </p>
                    )}

                    <div className="mt-9 max-w-56 divide-y divide-white/12">
                        <StatRow icon={<Droplet strokeWidth={1.25}/>} label={t("details.humidity")} value={`${current.relative_humidity_2m}%`}/>
                        <StatRow
                            icon={<Wind strokeWidth={1.25}/>}
                            label={t("details.wind")}
                            value={`${Math.round(current.wind_speed_10m)} ${t("details.kmh")}`}
                            detail={t(`compassAbbr.${compassPoint(current.wind_direction_10m)}`)}
                        />
                    </div>
                    {comparison && (
                        <p className="mt-2 text-[11px] font-light tracking-[0.12em] text-muted-foreground">
                            {t(`hero.yesterday.${comparison.trend}`, {delta: comparison.delta})}
                        </p>
                    )}
                </div>

                <FavoriteButton place={place} className="absolute top-0 right-0 z-20 sm:top-4"/>

                <GlassScene
                    key={`${conditionFromCode(current.weather_code)}-${isDay}`}
                    condition={conditionFromCode(current.weather_code)}
                    isDay={isDay}
                    intensity={intensityFromCode(current.weather_code)}
                    isWindy={current.wind_speed_10m >= WINDY_KMH}
                    className="absolute top-[3rem] right-[-7%] w-[66%] animate-[appear_1.2s_var(--ease-out)] sm:top-6 sm:right-[4%] sm:w-[36%] lg:top-[-1rem] lg:right-[12%] lg:w-[25%]"
                />
            </div>

            {children}

            {/* Weekday · time · date, the instrument panel's footer. */}
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 px-1 pt-4">
                <span className="text-[10.5px] font-light tracking-[0.3em] text-muted-foreground uppercase">
                    <span className="sm:hidden">{formatWeekday(now, timezone, locale, "short")}</span>
                    <span className="hidden sm:inline">{formatWeekday(now, timezone, locale)}</span>
                </span>
                <span className="text-center">
                    <span className="block text-2xl font-extralight tracking-[0.12em] tabular">{formatClock(now, timezone, locale)}</span>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing || !isOnline}
                        aria-label={t("common:refresh")}
                        className={cn("mt-0.5 inline-flex items-center gap-1 rounded-full px-2 text-[9.5px] font-light tracking-[0.18em] uppercase transition-colors hover:text-foreground disabled:opacity-70", isOnline ? "text-subtle-foreground" : "text-warning")}
                    >
                        <span aria-live="polite">{status}</span>
                        <RefreshCw className={cn("size-2.5", isRefreshing && "animate-spin")} aria-hidden/>
                    </button>
                </span>
                <span className="text-right text-[10.5px] font-light tracking-[0.3em] text-muted-foreground uppercase tabular">
                    {formatDayMonth(now, timezone, locale)} {year}
                </span>
            </div>
        </section>
    );
};

type CompactBarProps = {place: Place; current: CurrentWeather};

/** The slim "BAKU · 16° | CLOUDY" bar that slides in at the top once the big headline has scrolled away. */
export const CompactBar = ({place, current}: CompactBarProps) => {
    const {t} = useTranslation("weather");
    const {placeName} = usePlaceLabel();

    return (
        <div aria-hidden className="compact-bar pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-[env(safe-area-inset-top)]">
            <div style={{background: "rgb(9 11 15 / 0.97)"}} className="glass-strong mt-2 flex max-w-[calc(100%-2rem)] items-center gap-2.5 rounded-full px-5 py-2 text-[11px] font-light tracking-[0.24em] uppercase">
                <span className="truncate">{placeName(place)}</span>
                <span className="text-subtle-foreground">·</span>
                <span className="text-sm tracking-[0.08em] tabular">{roundTemp(current.temperature_2m)}°</span>
                <span className="text-subtle-foreground">|</span>
                <span className="truncate text-muted-foreground">{t(weatherLabelKey(current.weather_code))}</span>
            </div>
        </div>
    );
};
