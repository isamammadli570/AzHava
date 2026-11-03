import {memo, type CSSProperties} from "react";
import {ChevronRight} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatDayMonth, formatWeekday} from "@/helpers/dates";
import {formatTemp} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import {weatherLabelKey} from "@/helpers/weather";
import {WeatherGlyph} from "@/widgets/WeatherGlyph";

type DailyRowProps = {
    day: DailyPoint;
    index: number;
    bounds: {min: number; max: number};
    currentTemp: number | null;
    timezone: string;
    locale: string;
    onOpen: (index: number) => void;
    style?: CSSProperties;
};

const percent = (value: number, bounds: {min: number; max: number}): number => {
    const span = bounds.max - bounds.min || 1;
    return ((value - bounds.min) / span) * 100;
};

/** One day: name, icon, rain chance and a min→max bar on the shared scale; opens the day in the conditions sheet. */
export const DailyRow = memo(({day, index, bounds, currentTemp, timezone, locale, onOpen, style}: DailyRowProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const dayName = index === 0 ? t("common:today") : index === 1 ? t("common:tomorrow") : formatWeekday(day.time, timezone, locale, "short");
    const left = percent(day.min, bounds);
    const width = Math.max(percent(day.max, bounds) - left, 4);

    return (
        <li style={style} className="border-b border-white/10 last:border-b-0">
            <button
                type="button"
                aria-label={t("daily.toggle", {day: `${dayName}, ${formatDayMonth(day.time, timezone, locale)}`})}
                onClick={() => onOpen(index)}
                className="group grid min-h-14 w-full grid-cols-[4.5rem_2.5rem_minmax(0,1fr)_0.75rem] items-center gap-2 rounded-xl px-1 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-glass-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-3"
            >
                <span className="truncate text-[15px] font-light tracking-[0.12em] first-letter:uppercase">{dayName}</span>
                {/* Like the hourly strip: rain chance sits under the icon, in water cyan, only when it matters. */}
                <span className="flex flex-col items-center">
                    <WeatherGlyph code={day.weatherCode} size={22} label={t(weatherLabelKey(day.weatherCode))}/>
                    {day.precipitationProbability >= 20 && <span className="mt-0.5 text-[10px] font-light text-accent tabular">{day.precipitationProbability}%</span>}
                </span>
                <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-light tabular">
                    <span className="w-9 shrink-0 text-right text-subtle-foreground">{formatTemp(day.min)}</span>
                    <span className="relative h-1 min-w-0 flex-1 rounded-full bg-black/25">
                        <span
                            className="absolute inset-y-0 origin-left animate-bar-grow rounded-full"
                            style={{left: `${left}%`, width: `${width}%`, background: "linear-gradient(90deg, rgb(255 255 255 / 0.3), rgb(var(--tint)))", animationDelay: `${index * 50}ms`}}
                        />
                        {currentTemp !== null && (
                            <span
                                aria-hidden
                                className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-[2.5px] ring-[rgb(12_15_20)]"
                                style={{left: `${Math.min(100, Math.max(0, percent(currentTemp, bounds)))}%`}}
                            />
                        )}
                    </span>
                    <span className="w-9 shrink-0">{formatTemp(day.max)}</span>
                </span>
                <ChevronRight aria-hidden className="size-3.5 text-subtle-foreground transition-[translate,color] duration-(--duration-base) group-hover:translate-x-0.5 group-hover:text-foreground"/>
            </button>
        </li>
    );
});
