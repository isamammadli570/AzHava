import {useState, type ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {peakOf, trendOf, type DetailHour} from "@/helpers/detail";
import {formatNumber, formatTemp, uvLevel, UV_LEVEL} from "@/helpers/format";
import {cn} from "@/lib/utils";
import {SheetChart} from "@/pages/WeatherPage/widgets/DetailSheet/SheetChart";
import {Headline, SheetSection, SheetText, StatRows} from "@/pages/WeatherPage/widgets/DetailSheet/parts";

export type MetricKind = "uv" | "humidity" | "visibility" | "pressure";

const UV_COLOR: Record<string, string> = {
    [UV_LEVEL.LOW]: "var(--uv-low)",
    [UV_LEVEL.MODERATE]: "var(--uv-moderate)",
    [UV_LEVEL.HIGH]: "var(--uv-high)",
    [UV_LEVEL.VERY_HIGH]: "var(--uv-very-high)",
    [UV_LEVEL.EXTREME]: "var(--uv-extreme)",
};
const UV_RANGES: Record<string, string> = {
    [UV_LEVEL.LOW]: "0–2",
    [UV_LEVEL.MODERATE]: "3–5",
    [UV_LEVEL.HIGH]: "6–7",
    [UV_LEVEL.VERY_HIGH]: "8–10",
    [UV_LEVEL.EXTREME]: "11+",
};

type Metric = {
    pick: (hour: DetailHour) => number;
    format: (value: number) => string;
    color: string;
    kind?: "line" | "bars";
    domain?: (hours: DetailHour[]) => [number, number] | undefined;
};

const METRICS: Record<MetricKind, Metric> = {
    uv: {pick: (hour) => hour.uv, format: (value) => formatNumber(value, 0), color: "var(--uv-moderate)", kind: "bars", domain: (hours) => [0, Math.max(11, ...hours.map((hour) => Math.ceil(hour.uv)))]},
    humidity: {pick: (hour) => hour.humidity, format: (value) => `${Math.round(value)}%`, color: "var(--accent)", domain: () => [0, 100]},
    visibility: {pick: (hour) => hour.visibility, format: (value) => formatNumber(value, value < 10 ? 1 : 0), color: "rgb(214 221 232)", domain: (hours) => [0, Math.max(10, ...hours.map((hour) => Math.ceil(hour.visibility)))]},
    pressure: {pick: (hour) => hour.pressure, format: (value) => formatNumber(value, 0), color: "rgb(188 168 255)"},
};

type MetricSheetProps = {metric: MetricKind; hours: DetailHour[]; isToday: boolean; now: number; timezone: string; locale: string};

/** UV, humidity, visibility or pressure through the day: the reading hour by hour, a summary, a scale and what it means. */
export const MetricSheet = ({metric, hours, isToday, now, timezone, locale}: MetricSheetProps) => {
    const {t} = useTranslation("weather");
    const [active, setActive] = useState<number | null>(null);
    const config = METRICS[metric];
    const clock = (time: number) => formatClock(time, timezone, locale);
    const values = hours.map(config.pick);
    const high = peakOf(hours, config.pick);
    const low = peakOf(hours, config.pick, true);
    const currentHour = isToday ? hours.find((hour, index) => now >= hour.time && now < (hours[index + 1]?.time ?? hour.time + 3600)) : undefined;
    const shown = active !== null ? hours[active] : currentHour;
    const unit = {uv: "", humidity: "", visibility: t("details.km"), pressure: t("details.hpa")}[metric];

    const headlineValue = shown ? config.pick(shown) : (high?.value ?? 0);
    const headlineLabel = shown
        ? `${active !== null ? clock(shown.time) : t("common:now")}${metric === "uv" ? ` · ${t(`details.uvLevels.${uvLevel(shown.uv)}`)}` : ""}`
        : t("sheet.maxOfDay");

    let summary = "";
    let extra: ReactNode = null;
    if (high && low) {
        if (metric === "uv") {
            summary = high.value < 3 ? t("sheet.summary.uvLow") : t("sheet.summary.uv", {time: clock(high.time), value: Math.round(high.value), level: t(`details.uvLevels.${uvLevel(high.value)}`)});
            extra = (
                <SheetSection title={t("sheet.uvScale")}>
                    <StatRows
                        rows={Object.values(UV_LEVEL).map((level) => ({
                            key: level,
                            label: (
                                <span className={cn("flex items-center gap-2", uvLevel(high.value) === level && "text-foreground")}>
                                    <span className="size-2.5 rounded-full" style={{background: UV_COLOR[level]}}/>
                                    {t(`details.uvLevels.${level}`)}
                                </span>
                            ),
                            value: UV_RANGES[level],
                        }))}
                    />
                </SheetSection>
            );
        } else if (metric === "humidity") {
            const dew = {min: peakOf(hours, (hour) => hour.dewPoint, true)?.value ?? 0, max: peakOf(hours, (hour) => hour.dewPoint)?.value ?? 0};
            summary = t("sheet.summary.humidity", {min: Math.round(low.value), max: Math.round(high.value), dewMin: formatTemp(dew.min), dewMax: formatTemp(dew.max)});
            extra = (
                <SheetSection title={t("sheet.dewPointTitle")}>
                    <SheetText>{t("sheet.about.dewPoint")}</SheetText>
                </SheetSection>
            );
        } else if (metric === "visibility") {
            summary = t("sheet.summary.visibility", {min: formatNumber(low.value, low.value < 10 ? 1 : 0), max: formatNumber(high.value, high.value < 10 ? 1 : 0)});
            extra = (
                <SheetSection title={t("sheet.visibilityScale")}>
                    <StatRows
                        rows={[
                            {key: "clear", label: t("details.visibilityLevels.clear"), value: `≥ 10 ${t("details.km")}`},
                            {key: "moderate", label: t("details.visibilityLevels.moderate"), value: `4–10 ${t("details.km")}`},
                            {key: "poor", label: t("details.visibilityLevels.poor"), value: `< 4 ${t("details.km")}`},
                        ]}
                    />
                </SheetSection>
            );
        } else {
            const trend = trendOf(values[0], values[values.length - 1], 2);
            summary = t(`sheet.summary.pressure.${trend}`, {start: Math.round(values[0]), end: Math.round(values[values.length - 1])});
        }
    }

    return (
        <>
            <Headline
                value={
                    <>
                        {config.format(headlineValue)}
                        {unit && <span className="ml-2 text-base font-light tracking-[0.16em] text-muted-foreground uppercase">{unit}</span>}
                    </>
                }
                label={headlineLabel}
            />

            <SheetSection>
                <SheetChart
                    times={hours.map((hour) => hour.time)}
                    series={[{values}]}
                    kind={config.kind}
                    domain={config.domain?.(hours)}
                    format={config.format}
                    color={config.color}
                    barColor={metric === "uv" ? (value) => UV_COLOR[uvLevel(value)] : undefined}
                    timezone={timezone}
                    locale={locale}
                    now={isToday ? now : undefined}
                    showExtremes={config.kind !== "bars"}
                    label={t(`sheet.${metric}Chart`)}
                    onActiveChange={setActive}
                />
            </SheetSection>

            {summary && (
                <SheetSection title={t("sheet.daySummary")}>
                    <SheetText>{summary}</SheetText>
                </SheetSection>
            )}

            {extra}

            <SheetSection title={t(`sheet.about${metric.charAt(0).toUpperCase()}${metric.slice(1)}`)}>
                <SheetText>{t(`sheet.about.${metric}`)}</SheetText>
            </SheetSection>
        </>
    );
};
