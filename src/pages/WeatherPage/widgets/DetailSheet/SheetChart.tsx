import {useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {areaPath, niceTicks, scaleY, smoothPath, type Point} from "@/helpers/chart";
import {formatClock, localHour} from "@/helpers/dates";
import {clamp} from "@/helpers/format";
import {useElementWidth} from "@/hooks/useElementWidth";

const PAD = {left: 4, right: 40, top: 14, bottom: 24};

export type ChartSeries = {values: number[]; dashed?: boolean};

type SheetChartProps = {
    /** One timestamp per value (the hours of the day). */
    times: number[];
    /** The first series is the main one: filled, scrubbable, with high/low marks; the rest are drawn as faint lines. */
    series: ChartSeries[];
    kind?: "line" | "bars";
    /** Fixed vertical range (e.g. 0–100 %); otherwise it fits the data with round steps. */
    domain?: [number, number];
    format: (value: number) => string;
    /** Colour of the main series (any CSS colour). */
    color: string;
    /** Per-bar colour for bar charts (UV by level). */
    barColor?: (value: number) => string;
    timezone: string;
    locale: string;
    /** "Now", when it falls inside the day: hours before it are drawn dimmer. */
    now?: number;
    showExtremes?: boolean;
    /** Small marks above the plot (icons, wind arrows), drawn every `aboveEvery` hours. */
    renderAbove?: (index: number) => ReactNode;
    aboveEvery?: number;
    height?: number;
    label: string;
    /** Reports the scrubbed hour (or null when the pointer leaves), so the sheet can show its value as the headline. */
    onActiveChange?: (index: number | null) => void;
};

/**
 * Hour-by-hour chart drawn in real pixels: gridlines on round values, labels on the right, hours 00/06/12/18 below,
 * the past dimmed, high and low marked. Dragging (or arrow keys) scrubs through the hours. It reveals from left to
 * right when it appears or the day changes.
 */
export const SheetChart = ({
    times,
    series,
    kind = "line",
    domain,
    format,
    color,
    barColor,
    timezone,
    locale,
    now,
    showExtremes = false,
    renderAbove,
    aboveEvery = 2,
    height = 190,
    label,
    onActiveChange,
}: SheetChartProps) => {
    const {t} = useTranslation("weather");
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const [boxRef, width] = useElementWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);
    const count = times.length;
    const plotWidth = Math.max(0, width - PAD.left - PAD.right);
    const bottom = height - PAD.bottom;

    const ticks = useMemo(() => {
        if (domain) return niceTicks(domain[0], domain[1]);
        const values = series.flatMap((item) => item.values).filter(Number.isFinite);
        return values.length ? niceTicks(Math.min(...values), Math.max(...values)) : [];
    }, [domain, series]);
    const low = domain?.[0] ?? ticks[0] ?? 0;
    const high = domain?.[1] ?? ticks[ticks.length - 1] ?? 1;

    // Bars sit in equal bands; line points sit on the band edges' centres too, so both kinds share the hour labels.
    const band = count > 0 ? plotWidth / count : 0;
    const x = (index: number) => PAD.left + band * (index + 0.5);
    const y = (value: number) => scaleY(value, low, high, PAD.top, bottom);
    const pointsOf = (values: number[]): Point[] => values.map((value, index) => ({x: x(index), y: y(value)}));

    const main = series[0]?.values ?? [];
    const mainPoints = pointsOf(main);
    const nowIndex = now === undefined ? -1 : times.findIndex((time, index) => now >= time && now < (times[index + 1] ?? time + 3600));
    const nowX = nowIndex >= 0 && now !== undefined ? x(nowIndex) + ((now - times[nowIndex]) / 3600) * band : null;
    const extremes = showExtremes && main.length > 0 ? {max: main.indexOf(Math.max(...main)), min: main.indexOf(Math.min(...main))} : null;

    const changeActive = (index: number | null) => {
        setActive(index);
        onActiveChange?.(index);
    };
    const indexAt = (event: PointerEvent<SVGRectElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return clamp(Math.floor(((event.clientX - rect.left) / rect.width) * count), 0, count - 1);
    };
    const moveWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const start = active ?? Math.max(0, nowIndex);
        changeActive(clamp(start + (event.key === "ArrowRight" ? 1 : -1), 0, count - 1));
    };

    const hourLabels = times.map((time, index) => ({index, hour: localHour(time, timezone)})).filter(({hour}) => hour % 6 === 0);
    const activeValue = active !== null ? main[active] : null;

    return (
        <div
            ref={boxRef}
            role="img"
            aria-label={label}
            tabIndex={0}
            onKeyDown={moveWithKeys}
            onBlur={() => changeActive(null)}
            className="relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {renderAbove && width > 0 && (
                <div aria-hidden className="relative mb-1 h-6">
                    {times.map((time, index) =>
                        index % aboveEvery === 0 ? (
                            <span key={time} className="absolute top-0 flex -translate-x-1/2 justify-center" style={{left: x(index)}}>
                                {renderAbove(index)}
                            </span>
                        ) : null,
                    )}
                </div>
            )}

            {width > 0 && count > 0 && (
                <div key={times[0]} className="chart-reveal">
                    <svg width={width} height={height} className="block overflow-visible" aria-hidden>
                        <defs>
                            <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" stopColor={color} stopOpacity="0.4"/>
                                <stop offset="1" stopColor={color} stopOpacity="0.02"/>
                            </linearGradient>
                            {nowX !== null && (
                                <clipPath id={`${uid}-future`}>
                                    <rect x={nowX} y={0} width={width} height={height}/>
                                </clipPath>
                            )}
                        </defs>

                        {ticks.map((tick) => (
                            <g key={tick}>
                                <line x1={PAD.left} x2={PAD.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke="rgb(255 255 255 / 0.08)"/>
                                <text x={width - 2} y={y(tick) + 3.5} textAnchor="end" className="fill-subtle-foreground text-[10px] font-light tabular">
                                    {format(tick)}
                                </text>
                            </g>
                        ))}
                        {hourLabels.map(({index, hour}) => (
                            <g key={index}>
                                <line x1={x(index)} x2={x(index)} y1={PAD.top} y2={bottom} stroke="rgb(255 255 255 / 0.05)"/>
                                <text x={x(index)} y={height - 6} textAnchor="middle" className="fill-subtle-foreground text-[10px] font-light tabular">
                                    {String(hour).padStart(2, "0")}
                                </text>
                            </g>
                        ))}

                        {kind === "bars" ? (
                            main.map((value, index) => {
                                const top = y(Math.max(value, low));
                                const barHeight = Math.max(bottom - top, value > low ? 2 : 0);
                                return (
                                    <rect
                                        key={times[index]}
                                        x={x(index) - band * 0.3}
                                        y={bottom - barHeight}
                                        width={band * 0.6}
                                        height={barHeight}
                                        rx={Math.min(3, band * 0.3)}
                                        fill={barColor ? barColor(value) : color}
                                        opacity={nowX !== null && x(index) < nowX ? 0.4 : active === null || active === index ? 0.95 : 0.55}
                                    />
                                );
                            })
                        ) : (
                            <>
                                {series.slice(1).map((item, index) => (
                                    <path key={index} d={smoothPath(pointsOf(item.values))} fill="none" stroke="rgb(255 255 255 / 0.4)" strokeWidth={1.5} strokeDasharray={item.dashed ? "4 4" : undefined}/>
                                ))}
                                <path d={areaPath(mainPoints, bottom)} fill={`url(#${uid}-fill)`}/>
                                {/* The past dimmed, the hours ahead in full colour on top of it. */}
                                <path d={smoothPath(mainPoints)} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" opacity={nowX !== null ? 0.4 : 1}/>
                                {nowX !== null && <path d={smoothPath(mainPoints)} fill="none" stroke={color} strokeWidth={2.25} strokeLinecap="round" clipPath={`url(#${uid}-future)`}/>}
                            </>
                        )}

                        {nowX !== null && active === null && (
                            <line x1={nowX} x2={nowX} y1={PAD.top} y2={bottom} stroke="rgb(255 255 255 / 0.35)" strokeDasharray="2 3"/>
                        )}

                        {extremes && kind === "line" && active === null && (
                            <>
                                <Extreme x={x(extremes.max)} y={y(main[extremes.max])} label={t("sheet.highShort")} above/>
                                <Extreme x={x(extremes.min)} y={y(main[extremes.min])} label={t("sheet.lowShort")}/>
                            </>
                        )}

                        {active !== null && activeValue !== null && (
                            <g>
                                <line x1={x(active)} x2={x(active)} y1={PAD.top - 6} y2={bottom} stroke="rgb(255 255 255 / 0.6)"/>
                                {kind === "line" && <circle cx={x(active)} cy={y(activeValue)} r={4.5} fill={color} stroke="rgb(12 15 20)" strokeWidth={2}/>}
                            </g>
                        )}

                        <rect
                            x={PAD.left}
                            y={0}
                            width={plotWidth}
                            height={height}
                            fill="transparent"
                            className="cursor-crosshair touch-pan-y"
                            onPointerDown={(event) => changeActive(indexAt(event))}
                            onPointerMove={(event) => (event.pointerType === "mouse" || event.buttons > 0) && changeActive(indexAt(event))}
                            onPointerLeave={() => changeActive(null)}
                            onPointerUp={(event) => event.pointerType !== "mouse" && changeActive(null)}
                        />
                    </svg>
                </div>
            )}

            {active !== null && activeValue !== null && (
                <p
                    aria-live="polite"
                    className="pointer-events-none absolute -top-1 rounded-full bg-[rgb(22_26_34/0.92)] px-2.5 py-1 text-[11px] font-light tracking-[0.06em] whitespace-nowrap shadow-lg tabular"
                    style={{left: clamp(x(active), 50, Math.max(50, width - 50)), transform: "translate(-50%, -100%)"}}
                >
                    {formatClock(times[active], timezone, locale)} · {format(activeValue)}
                </p>
            )}
        </div>
    );
};

type ExtremeProps = {x: number; y: number; label: string; above?: boolean};

/** A high or low point: a ringed dot with its letter just above or below. */
const Extreme = ({x, y, label, above = false}: ExtremeProps) => (
    <g>
        <circle cx={x} cy={y} r={3.5} fill="rgb(12 15 20)" stroke="currentColor" strokeWidth={1.5} className="text-foreground"/>
        <text x={x} y={above ? y - 9 : y + 16} textAnchor="middle" className="fill-foreground text-[10px] font-medium">
            {label}
        </text>
    </g>
);
