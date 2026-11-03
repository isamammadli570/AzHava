import {useState} from "react";
import {ArrowUp} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {BEAUFORT_LEVELS, beaufortColor, beaufortForce, beaufortRange, peakOf, type DetailHour} from "@/helpers/detail";
import {compassPoint} from "@/helpers/format";
import {cn} from "@/lib/utils";
import {SheetChart} from "@/pages/WeatherPage/widgets/DetailSheet/SheetChart";
import {Headline, SheetSection, SheetText} from "@/pages/WeatherPage/widgets/DetailSheet/parts";

type WindSheetProps = {
    hours: DetailHour[];
    /** The day before the shown one, for the gust comparison (empty when not loaded). */
    previousHours: DetailHour[];
    previousLabel: string;
    /** Name of the day shown ("Today", or its weekday). */
    dayLabel: string;
    isToday: boolean;
    now: number;
    timezone: string;
    locale: string;
};

/** Points the way the wind blows (meteorological direction is where it comes from). */
const WindArrow = ({direction, size = 13}: {direction: number; size?: number}) => (
    <ArrowUp className="text-muted-foreground" style={{width: size, height: size, rotate: `${direction + 180}deg`}} strokeWidth={1.75} aria-hidden/>
);

/**
 * Wind through the day: speed and gusts hour by hour with arrows showing where it blows, a summary, today's strongest
 * gust against the day before, and the Beaufort scale with today's force highlighted.
 */
export const WindSheet = ({hours, previousHours, previousLabel, dayLabel, isToday, now, timezone, locale}: WindSheetProps) => {
    const {t} = useTranslation("weather");
    const [active, setActive] = useState<number | null>(null);
    const clock = (time: number) => formatClock(time, timezone, locale);
    const unit = t("details.kmh");

    const currentHour = isToday ? hours.find((hour, index) => now >= hour.time && now < (hours[index + 1]?.time ?? hour.time + 3600)) : undefined;
    const shown = active !== null ? hours[active] : currentHour;
    const strongest = peakOf(hours, (hour) => hour.windSpeed);
    const gustiest = peakOf(hours, (hour) => hour.windGusts);
    const previousGust = peakOf(previousHours, (hour) => hour.windGusts);
    const mainDirection = strongest ? hours.find((hour) => hour.time === strongest.time)?.windDirection ?? 0 : 0;
    const force = beaufortForce(shown?.windSpeed ?? strongest?.value ?? 0);
    const compareMax = Math.max(gustiest?.value ?? 0, previousGust?.value ?? 0, 1);

    const summary =
        strongest && gustiest
            ? t("sheet.summary.wind", {
                  time: clock(strongest.time),
                  speed: Math.round(strongest.value),
                  gust: Math.round(gustiest.value),
                  direction: t(`compass.${compassPoint(mainDirection)}`),
              })
            : "";

    return (
        <>
            <Headline
                value={
                    <>
                        {Math.round(shown?.windSpeed ?? strongest?.value ?? 0)}
                        <span className="ml-2 text-base font-light tracking-[0.16em] text-muted-foreground uppercase">{unit}</span>
                    </>
                }
                label={
                    shown
                        ? `${active !== null ? `${clock(shown.time)} · ` : ""}${t(`compass.${compassPoint(shown.windDirection)}`)} · ${t("details.gustsLabel")} ${Math.round(shown.windGusts)} ${unit}`
                        : t("sheet.maxOfDay")
                }
                aside={shown && <WindArrow direction={shown.windDirection} size={34}/>}
            />

            <SheetSection>
                <SheetChart
                    times={hours.map((hour) => hour.time)}
                    series={[{values: hours.map((hour) => hour.windSpeed)}, {values: hours.map((hour) => hour.windGusts), dashed: true}]}
                    domain={[0, Math.max(20, gustiest?.value ?? 0)]}
                    format={(value) => `${Math.round(value)}`}
                    color="rgb(110 214 200)"
                    timezone={timezone}
                    locale={locale}
                    now={isToday ? now : undefined}
                    renderAbove={(index) => <WindArrow direction={hours[index].windDirection}/>}
                    label={t("sheet.windChart")}
                    onActiveChange={setActive}
                />
                <p className="mt-3 flex items-center gap-4 text-[11px] font-light text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-[rgb(110_214_200)]"/>{t("details.windSpeed")}</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-white/50"/>{t("details.gustsLabel")}</span>
                </p>
            </SheetSection>

            {summary && (
                <SheetSection title={t("sheet.daySummary")}>
                    <SheetText>{summary}</SheetText>
                </SheetSection>
            )}

            {gustiest && previousGust && (
                <SheetSection title={t("sheet.compare")}>
                    <SheetText>{t(gustiest.value > previousGust.value ? "sheet.compareStronger" : gustiest.value < previousGust.value ? "sheet.compareWeaker" : "sheet.compareSame")}</SheetText>
                    <div className="mt-4 space-y-2.5">
                        {[
                            {label: dayLabel, value: gustiest.value, className: "bg-[rgb(110_214_200)]"},
                            {label: previousLabel, value: previousGust.value, className: "bg-white/35"},
                        ].map((row) => (
                            <div key={row.label} className="flex items-center gap-3 text-[13px] font-light">
                                <span className="w-20 shrink-0 truncate text-muted-foreground first-letter:uppercase">{row.label}</span>
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
                                    <span className={cn("block h-full origin-left animate-bar-grow rounded-full", row.className)} style={{width: `${(row.value / compareMax) * 100}%`}}/>
                                </span>
                                <span className="w-16 shrink-0 text-right tabular">{Math.round(row.value)} {unit}</span>
                            </div>
                        ))}
                    </div>
                </SheetSection>
            )}

            <SheetSection title={t("sheet.beaufortTitle")}>
                <SheetText>{t("sheet.about.beaufort")}</SheetText>
                <table className="mt-4 w-full text-[13px] font-light">
                    <thead>
                        <tr className="text-[10px] tracking-[0.16em] text-subtle-foreground uppercase">
                            <th className="w-12 pb-2 text-left font-light">{t("sheet.bft")}</th>
                            <th className="pb-2 text-left font-light">{t("sheet.description")}</th>
                            <th className="pb-2 text-right font-light">{unit}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({length: BEAUFORT_LEVELS}, (_, level) => (
                            <tr key={level} className={cn("border-t border-white/8", level === force && "bg-white/8")}>
                                <td className="py-2 pl-1">
                                    <span className="flex items-center gap-2 tabular">
                                        <span className="size-2.5 rounded-full" style={{background: beaufortColor(level)}}/>
                                        {level}
                                    </span>
                                </td>
                                <td className={cn("py-2", level === force ? "text-foreground" : "text-muted-foreground")}>{t(`sheet.beaufort.${level}`)}</td>
                                <td className="py-2 pr-1 text-right tabular">{beaufortRange(level)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SheetSection>

            <SheetSection title={t("sheet.aboutWind")}>
                <SheetText>{t("sheet.about.wind")}</SheetText>
            </SheetSection>
        </>
    );
};
