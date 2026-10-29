import {memo, type CSSProperties, type ReactNode} from "react";
import {ChevronDown, Droplet, Sunrise, SunMedium, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {temperatureGradient} from "@/helpers/color";
import {formatClock, formatDayMonth, formatWeekday} from "@/helpers/dates";
import {compassPoint, formatNumber, formatTemp} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import {weatherLabelKey} from "@/helpers/weather";
import {WeatherIcon} from "@/widgets/WeatherIcon";
import {cn} from "@/lib/utils";

type DailyRowProps = {
    day: DailyPoint;
    index: number;
    bounds: {min: number; max: number};
    currentTemp: number | null;
    timezone: string;
    locale: string;
    isOpen: boolean;
    onToggle: (index: number) => void;
    style?: CSSProperties;
};

const percent = (value: number, bounds: {min: number; max: number}): number => {
    const span = bounds.max - bounds.min || 1;
    return ((value - bounds.min) / span) * 100;
};

/** One day: name, icon, rain chance and a min→max bar on the shared scale; expands into the day's details. */
export const DailyRow = memo(({day, index, bounds, currentTemp, timezone, locale, isOpen, onToggle, style}: DailyRowProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const dayName = index === 0 ? t("common:today") : index === 1 ? t("common:tomorrow") : formatWeekday(day.time, timezone, locale, "short");
    const left = percent(day.min, bounds);
    const width = Math.max(percent(day.max, bounds) - left, 4);
    const panelId = `day-panel-${day.time}`;

    return (
        <li style={style}>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={t("daily.toggle", {day: `${dayName}, ${formatDayMonth(day.time, timezone, locale)}`})}
                onClick={() => onToggle(index)}
                className="grid w-full grid-cols-[4.25rem_2.25rem_2.75rem_minmax(0,1fr)_1rem] items-center gap-2 rounded-2xl px-2 py-2.5 text-left transition-colors duration-(--duration-fast) hover:bg-glass-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-3"
            >
                <span className="min-w-0">
                    <span className={cn("block truncate text-sm font-semibold first-letter:uppercase", index === 0 && "text-brand")}>{dayName}</span>
                    <span className="block text-[11px] text-subtle-foreground tabular">{formatDayMonth(day.time, timezone, locale)}</span>
                </span>
                <WeatherIcon code={day.weatherCode} size={34} isAnimated={false} label={t(weatherLabelKey(day.weatherCode))}/>
                <span className={cn("flex items-center gap-0.5 text-xs font-semibold tabular", day.precipitationProbability >= 20 ? "text-accent" : "text-transparent")}>
                    <Droplet className="size-3 fill-current" aria-hidden/>
                    {day.precipitationProbability}%
                </span>
                <span className="flex min-w-0 items-center gap-2 text-sm tabular">
                    <span className="w-8 shrink-0 text-right text-muted-foreground">{formatTemp(day.min)}</span>
                    <span className="relative h-1.5 min-w-0 flex-1 rounded-full bg-white/10">
                        <span
                            className="absolute inset-y-0 origin-left animate-bar-grow rounded-full"
                            style={{left: `${left}%`, width: `${width}%`, background: temperatureGradient(day.min, day.max), animationDelay: `${index * 50}ms`}}
                        />
                        {currentTemp !== null && (
                            <span
                                aria-hidden
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/60 bg-white shadow"
                                style={{left: `${Math.min(100, Math.max(0, percent(currentTemp, bounds)))}%`}}
                            />
                        )}
                    </span>
                    <span className="w-8 shrink-0 font-semibold">{formatTemp(day.max)}</span>
                </span>
                <ChevronDown aria-hidden className={cn("size-4 text-subtle-foreground transition-transform duration-(--duration-base)", isOpen && "rotate-180")}/>
            </button>

            <div id={panelId} className={cn("grid transition-[grid-template-rows,opacity] duration-(--duration-base) ease-(--ease-out)", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden" inert={!isOpen}>
                    <p className="px-2 pt-1 text-sm font-medium">{t(weatherLabelKey(day.weatherCode))}</p>
                    <dl className="grid grid-cols-2 gap-2 px-2 pt-2 pb-3 text-xs sm:grid-cols-4 lg:grid-cols-2">
                        <Detail icon={<Droplet/>} label={t("daily.precipitation")} value={`${formatNumber(day.precipitationSum, 1)} ${t("details.mm")} · ${day.precipitationProbability}%`}/>
                        <Detail icon={<Wind/>} label={t("daily.wind")} value={`${Math.round(day.windMax)} ${t("details.kmh")} · ${t(`compass.${compassPoint(day.windDirection)}`)}`}/>
                        <Detail icon={<SunMedium/>} label={t("daily.uv")} value={formatNumber(day.uvMax, 1)}/>
                        <Detail icon={<Sunrise/>} label={`${t("daily.sunrise")} / ${t("daily.sunset")}`} value={`${formatClock(day.sunrise, timezone, locale)} – ${formatClock(day.sunset, timezone, locale)}`}/>
                    </dl>
                </div>
            </div>
        </li>
    );
});

type DetailProps = {icon: ReactNode; label: string; value: string};

const Detail = ({icon, label, value}: DetailProps) => (
    <div className="rounded-xl bg-white/6 px-3 py-2">
        <dt className="flex items-center gap-1.5 text-subtle-foreground [&_svg]:size-3">
            {icon}
            {label}
        </dt>
        <dd className="mt-0.5 font-semibold tabular first-letter:uppercase">{value}</dd>
    </div>
);
