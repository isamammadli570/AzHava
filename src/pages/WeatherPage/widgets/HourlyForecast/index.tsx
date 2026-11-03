import {memo, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent} from "react";
import {ChevronLeft, ChevronRight, Maximize2} from "lucide-react";
import {useTranslation} from "react-i18next";
import {HOURLY_RANGES, type HourlyRange} from "@/constants/other";
import {formatClock, formatWeekday, localDateKey} from "@/helpers/dates";
import {clamp, formatTemp} from "@/helpers/format";
import type {HourlyPoint} from "@/helpers/forecast";
import {weatherLabelKey} from "@/helpers/weather";
import {useOpenSheet} from "@/hooks/useDetailSheet";
import {useLanguage} from "@/hooks/useLanguage";
import {Card} from "@/components/ui/card";
import {WeatherGlyph} from "@/widgets/WeatherGlyph";
import {cn} from "@/lib/utils";

const COLUMN = 68;
const SCROLL_STEP = COLUMN * 5;

type HourlyForecastProps = {hours: HourlyPoint[]; timezone: string; placeId: string; summary: string};

/**
 * The hours ahead as a frosted strip of columns (time, outline symbol, temperature, rain chance), under a one-line
 * summary. Pointing at, tapping or arrow-keying to an hour spells it out in the line below the strip.
 */
export const HourlyForecast = memo(({hours, timezone, placeId, summary}: HourlyForecastProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const openSheet = useOpenSheet();
    const [range, setRange] = useState<HourlyRange>(24);
    const [activeIndex, setActiveIndex] = useState(0);
    const [edges, setEdges] = useState({atStart: true, atEnd: false});
    const scrollerRef = useRef<HTMLDivElement>(null);
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const items = useMemo(() => hours.slice(0, range), [hours, range]);
    const active = items[Math.min(activeIndex, items.length - 1)];

    const updateEdges = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const atStart = scroller.scrollLeft < 8;
        const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 8;
        setEdges((previous) => (previous.atStart === atStart && previous.atEnd === atEnd ? previous : {atStart, atEnd}));
    }, []);

    useEffect(() => {
        updateEdges();
        window.addEventListener("resize", updateEdges);
        return () => window.removeEventListener("resize", updateEdges);
    }, [updateEdges, range]);

    const scrollByStep = (direction: 1 | -1) => scrollerRef.current?.scrollBy({left: direction * SCROLL_STEP, behavior: "smooth"});

    const moveWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const next = clamp(activeIndex + (event.key === "ArrowRight" ? 1 : -1), 0, items.length - 1);
        setActiveIndex(next);
        scrollerRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({block: "nearest", inline: "nearest", behavior: "smooth"});
    };

    const timeLabel = (hour: HourlyPoint, index: number): string => {
        if (index === 0) return t("common:now");
        // Midnight shows the new weekday instead of 00:00, so the second day is easy to find.
        const isNewDay = localDateKey(hour.time, timezone) !== localDateKey(items[index - 1].time, timezone);
        return isNewDay ? formatWeekday(hour.time, timezone, locale, "short") : formatClock(hour.time, timezone, locale);
    };

    return (
        <Card aria-labelledby={`${uid}-title`} className="spotlight rounded-[1.5rem] px-0 pt-4 pb-3 sm:px-0">
            <div className="flex items-center justify-between gap-2 px-4 sm:px-5">
                <h2 id={`${uid}-title`} className="section-label">{t("hourly.title")}</h2>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => scrollByStep(-1)} disabled={edges.atStart} aria-label={t("hourly.previous")} className="hidden size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 sm:grid">
                        <ChevronLeft className="size-4" strokeWidth={1.5}/>
                    </button>
                    <button type="button" onClick={() => scrollByStep(1)} disabled={edges.atEnd} aria-label={t("hourly.next")} className="hidden size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 sm:grid">
                        <ChevronRight className="size-4" strokeWidth={1.5}/>
                    </button>
                    {HOURLY_RANGES.map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={range === value}
                            onClick={() => {
                                setRange(value);
                                setActiveIndex(0);
                            }}
                            className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-light tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                range === value ? "bg-white/10 text-foreground" : "text-subtle-foreground hover:text-foreground",
                            )}
                        >
                            {t("hourly.range", {count: value})}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => openSheet("conditions")}
                        aria-label={t("sheet.openConditions")}
                        title={t("sheet.openConditions")}
                        className="ml-0.5 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <Maximize2 className="size-3.5" strokeWidth={1.5}/>
                    </button>
                </div>
            </div>
            <p className="mt-2 px-4 text-[13px] leading-snug font-light text-muted-foreground sm:px-5">{summary}</p>

            <div
                ref={scrollerRef}
                role="region"
                tabIndex={0}
                aria-label={t("hourly.chartLabel", {count: items.length})}
                onScroll={updateEdges}
                onKeyDown={moveWithKeys}
                className="mask-fade-x scrollbar-none mt-2 overflow-x-auto overscroll-x-contain scroll-smooth focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
                <ol key={`${placeId}-${range}`} className="stagger flex w-max px-2.5 sm:px-3.5">
                    {items.map((hour, index) => {
                        const isActive = hour === active;
                        return (
                            <li key={hour.time} data-index={index} style={{width: COLUMN, "--i": Math.min(index, 8)} as CSSProperties}>
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    aria-pressed={isActive}
                                    onPointerEnter={(event) => event.pointerType === "mouse" && setActiveIndex(index)}
                                    onClick={() => setActiveIndex(index)}
                                    className={cn(
                                        "flex w-full flex-col items-center gap-2.5 rounded-2xl py-2.5 transition-colors duration-(--duration-fast)",
                                        isActive ? "bg-white/[0.06] ring-1 ring-white/10" : "hover:bg-white/[0.03]",
                                    )}
                                >
                                    <span className={cn("text-[11px] font-light tracking-[0.12em] tabular first-letter:uppercase", index === 0 ? "text-brand" : "text-muted-foreground")}>
                                        {timeLabel(hour, index)}
                                    </span>
                                    <WeatherGlyph code={hour.weatherCode} isDay={hour.isDay} size={22} className={cn(index === 0 && "text-brand")}/>
                                    <span className="text-[15px] font-light tabular">{formatTemp(hour.temperature)}</span>
                                    <span className={cn("h-3 text-[9.5px] font-light tracking-[0.08em] tabular", hour.precipitationProbability >= 20 ? "text-accent" : "text-transparent")}>
                                        {hour.precipitationProbability}%
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>

            {active && (
                <p aria-live="polite" className="mt-1 truncate border-t border-white/[0.07] px-4 pt-2.5 text-[11px] font-light tracking-[0.06em] text-muted-foreground sm:px-5">
                    <span className="text-foreground first-letter:uppercase">{formatWeekday(active.time, timezone, locale, "short")}, {formatClock(active.time, timezone, locale)}</span>
                    {" · "}{t(weatherLabelKey(active.weatherCode))}
                    {" · "}{t("hourly.feelsLike")} {formatTemp(active.apparentTemperature)}
                    {" · "}{t("hourly.wind")} {Math.round(active.windSpeed)} {t("details.kmh")}
                    {" · "}<span className="text-accent">{active.precipitationProbability}%</span>
                </p>
            )}
        </Card>
    );
});
