import {useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent} from "react";
import {ChevronLeft, ChevronRight, Clock, Droplet, Thermometer, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {HOURLY_RANGES, type HourlyRange} from "@/constants/other";
import {areaPath, scaleY, smoothPath} from "@/helpers/chart";
import {temperatureColor} from "@/helpers/color";
import {formatClock, formatWeekday, localDateKey} from "@/helpers/dates";
import {clamp, formatTemp, roundTemp} from "@/helpers/format";
import type {HourlyPoint} from "@/helpers/forecast";
import {weatherLabelKey} from "@/helpers/weather";
import {useLanguage} from "@/hooks/useLanguage";
import {Button} from "@/components/ui/button";
import {Card, CardHeader} from "@/components/ui/card";
import {SegmentedControl} from "@/widgets/SegmentedControl";
import {WeatherIcon} from "@/widgets/WeatherIcon";
import {cn} from "@/lib/utils";

const COLUMN = 60;
const CHART_HEIGHT = 112;
const CHART_TOP = 30;
const CHART_BOTTOM = 96;
const BAR_HEIGHT = 30;
const TOOLTIP_WIDTH = 168;
const SCROLL_STEP = COLUMN * 6;

type HourlyForecastProps = {hours: HourlyPoint[]; timezone: string; placeId: string};

/**
 * Next 24/48 hours as one scrollable strip: time, icon, a smooth temperature curve coloured by temperature, and
 * precipitation chance bars. Hover, tap or arrow keys pick an hour and open its details; night hours get a faint band.
 */
export const HourlyForecast = ({hours, timezone, placeId}: HourlyForecastProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const [range, setRange] = useState<HourlyRange>(24);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [edges, setEdges] = useState({atStart: true, atEnd: false});
    const scrollerRef = useRef<HTMLDivElement>(null);
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const items = useMemo(() => hours.slice(0, range), [hours, range]);
    const width = items.length * COLUMN;

    const chart = useMemo(() => {
        const temps = items.map((hour) => hour.temperature);
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        const points = items.map((hour, index) => ({x: index * COLUMN + COLUMN / 2, y: scaleY(hour.temperature, min, max, CHART_TOP, CHART_BOTTOM)}));
        const stops = items.map((hour, index) => ({offset: items.length > 1 ? index / (items.length - 1) : 0, color: temperatureColor(hour.temperature)}));
        return {points, stops, line: smoothPath(points), area: areaPath(points, CHART_HEIGHT)};
    }, [items]);

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

    const pickFromPointer = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setActiveIndex(clamp(Math.floor((event.clientX - rect.left) / COLUMN), 0, items.length - 1));
    };

    const moveWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Escape") return;
        event.preventDefault();
        if (event.key === "Escape") {
            setActiveIndex(null);
            return;
        }
        const step = event.key === "ArrowRight" ? 1 : -1;
        const next = clamp((activeIndex ?? (step > 0 ? -1 : 1)) + step, 0, items.length - 1);
        setActiveIndex(next);
        const scroller = scrollerRef.current;
        if (scroller) {
            const left = next * COLUMN;
            if (left < scroller.scrollLeft || left + COLUMN > scroller.scrollLeft + scroller.clientWidth) scroller.scrollTo({left: left - scroller.clientWidth / 2, behavior: "smooth"});
        }
    };

    const rangeOptions = HOURLY_RANGES.map((value) => ({value, label: t("hourly.range", {count: value})}));

    const timeLabel = (hour: HourlyPoint, index: number): string => {
        if (index === 0) return t("common:now");
        // Midnight shows the new weekday instead of 00:00, so the second day is easy to find.
        const isNewDay = localDateKey(hour.time, timezone) !== localDateKey(items[index - 1].time, timezone);
        return isNewDay ? formatWeekday(hour.time, timezone, locale, "short") : formatClock(hour.time, timezone, locale);
    };

    const active = activeIndex !== null ? items[activeIndex] : undefined;
    const tooltipLeft = activeIndex !== null ? clamp(activeIndex * COLUMN + COLUMN / 2 - TOOLTIP_WIDTH / 2, 0, Math.max(0, width - TOOLTIP_WIDTH)) : 0;

    return (
        <Card aria-labelledby={`${uid}-title`} className="spotlight [grid-area:hourly]">
            <CardHeader
                id={`${uid}-title`}
                icon={<Clock/>}
                title={t("hourly.title")}
                actions={
                    <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={() => scrollByStep(-1)} disabled={edges.atStart} aria-label={t("hourly.previous")}>
                            <ChevronLeft/>
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={() => scrollByStep(1)} disabled={edges.atEnd} aria-label={t("hourly.next")}>
                            <ChevronRight/>
                        </Button>
                        <SegmentedControl options={rangeOptions} value={range} onChange={(value) => {
                            setRange(value);
                            setActiveIndex(null);
                        }} label={t("hourly.title")}/>
                    </div>
                }
            />
            <div
                ref={scrollerRef}
                role="region"
                tabIndex={0}
                aria-label={t("hourly.chartLabel", {count: items.length})}
                aria-describedby={`${uid}-hint`}
                onScroll={updateEdges}
                onKeyDown={moveWithKeys}
                onBlur={() => setActiveIndex(null)}
                className="mask-fade-x scrollbar-none -mx-4 overflow-x-auto overscroll-x-contain scroll-smooth rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:-mx-5"
            >
                <div className="relative px-4 sm:px-5" style={{width: width + 40}}>
                    <div
                        key={`${placeId}-${range}`}
                        className="relative touch-pan-x"
                        style={{width}}
                        onPointerMove={pickFromPointer}
                        onPointerDown={pickFromPointer}
                        onPointerLeave={(event) => event.pointerType === "mouse" && setActiveIndex(null)}
                    >
                        {/* Night bands span the whole column height behind everything. */}
                        <div aria-hidden className="absolute inset-0 flex">
                            {items.map((hour) => <div key={hour.time} className={hour.isDay ? "w-[60px]" : "w-[60px] bg-black/12"}/>)}
                        </div>
                        <div
                            aria-hidden
                            className={cn("absolute inset-y-0 w-[60px] rounded-2xl bg-white/10 ring-1 ring-white/15 transition-[translate,opacity] duration-150 ease-(--ease-out)", activeIndex === null ? "opacity-0" : "opacity-100")}
                            style={{translate: `${(activeIndex ?? 0) * COLUMN}px 0`}}
                        />

                        <ol className="relative grid" style={{gridTemplateColumns: `repeat(${items.length}, ${COLUMN}px)`}}>
                            {items.map((hour, index) => (
                                <li key={hour.time} className="flex flex-col items-center gap-1.5 pt-2">
                                    <span className={index === 0 ? "text-xs font-semibold text-brand" : "text-xs font-medium text-muted-foreground tabular first-letter:uppercase"}>
                                        {timeLabel(hour, index)}
                                    </span>
                                    <WeatherIcon code={hour.weatherCode} isDay={hour.isDay} size={32} isAnimated={index < 6 || index === activeIndex}/>
                                    <span className="sr-only">
                                        {roundTemp(hour.temperature)}°, {t("hourly.precipitation")} {hour.precipitationProbability}%
                                    </span>
                                </li>
                            ))}
                        </ol>

                        <svg aria-hidden width={width} height={CHART_HEIGHT} className="relative block overflow-visible">
                            <defs>
                                <linearGradient id={`${uid}-line`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
                                    {chart.stops.map((stop) => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color}/>)}
                                </linearGradient>
                                <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#ffffff" stopOpacity=".22"/>
                                    <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <path d={chart.area} fill={`url(#${uid}-area)`} className="animate-fade-in [animation-delay:400ms]"/>
                            <path d={chart.line} fill="none" stroke={`url(#${uid}-line)`} strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1" className="animate-draw"/>
                            {chart.points.map((point, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <g key={items[index].time} className="animate-fade-in" style={{animationDelay: `${300 + index * 25}ms`}}>
                                        {index === 0 && <circle cx={point.x} cy={point.y} r="9" fill="var(--brand)" opacity=".25" className="animate-ping [transform-box:fill-box] [transform-origin:center]"/>}
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={isActive ? 6 : index === 0 ? 4.5 : 3}
                                            fill={index === 0 ? "var(--brand)" : "#fff"}
                                            stroke={isActive ? temperatureColor(items[index].temperature) : "none"}
                                            strokeWidth="3"
                                            className="transition-[r] duration-150"
                                        />
                                        <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-foreground text-[13px] font-semibold tabular">
                                            {roundTemp(items[index].temperature)}°
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        <ol aria-hidden className="relative grid pb-2" style={{gridTemplateColumns: `repeat(${items.length}, ${COLUMN}px)`}}>
                            {items.map((hour, index) => (
                                <li key={hour.time} className="flex flex-col items-center gap-1">
                                    <div className="flex w-2.5 items-end overflow-hidden rounded-full bg-white/8" style={{height: BAR_HEIGHT}}>
                                        <div
                                            className="w-full origin-bottom animate-[grow-up_700ms_var(--ease-out)_both] rounded-full bg-gradient-to-t from-accent/60 to-accent"
                                            style={{height: `${Math.max(hour.precipitationProbability, 0)}%`, animationDelay: `${400 + index * 20}ms`}}
                                        />
                                    </div>
                                    <span className={hour.precipitationProbability >= 20 ? "flex items-center gap-0.5 text-[11px] font-semibold text-accent tabular" : "text-[11px] text-subtle-foreground tabular"}>
                                        {hour.precipitationProbability >= 20 && <Droplet className="size-2.5 fill-current"/>}
                                        {hour.precipitationProbability}%
                                    </span>
                                </li>
                            ))}
                        </ol>

                        {active && (
                            <div
                                role="status"
                                className="pointer-events-none absolute top-1 z-10 rounded-2xl border border-glass-border bg-surface p-3 text-xs shadow-2xl transition-[left] duration-150 ease-(--ease-out)"
                                style={{left: tooltipLeft, width: TOOLTIP_WIDTH}}
                            >
                                <p className="font-semibold first-letter:uppercase">
                                    {formatWeekday(active.time, timezone, locale, "short")}, <span className="tabular">{formatClock(active.time, timezone, locale)}</span>
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <WeatherIcon code={active.weatherCode} isDay={active.isDay} size={30}/>
                                    <span className="font-display text-2xl font-semibold tabular">{formatTemp(active.temperature)}</span>
                                </div>
                                <p className="mt-1 truncate text-muted-foreground">{t(weatherLabelKey(active.weatherCode))}</p>
                                <dl className="mt-2 space-y-1 text-muted-foreground">
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="flex items-center gap-1"><Thermometer className="size-3"/>{t("hourly.feelsLike")}</dt>
                                        <dd className="font-semibold text-foreground tabular">{formatTemp(active.apparentTemperature)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="flex items-center gap-1"><Wind className="size-3"/>{t("hourly.wind")}</dt>
                                        <dd className="font-semibold text-foreground tabular">{Math.round(active.windSpeed)} {t("details.kmh")}</dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <dt className="flex items-center gap-1"><Droplet className="size-3"/>{t("hourly.precipitation")}</dt>
                                        <dd className="font-semibold text-accent tabular">{active.precipitationProbability}%</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <p id={`${uid}-hint`} className="mt-2 text-[11px] text-subtle-foreground">{t("hourly.hint")}</p>
        </Card>
    );
};
