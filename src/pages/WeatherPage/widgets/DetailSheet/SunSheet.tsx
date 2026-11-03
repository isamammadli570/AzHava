import {useMemo} from "react";
import SunCalc from "suncalc";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {dayProgress, splitDuration} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import {SheetSection, SheetText, StatRows} from "@/pages/WeatherPage/widgets/DetailSheet/parts";

const WIDTH = 320;
const HEIGHT = 150;
const HORIZON = 120;
const RX = 140;
const RY = 100;
const CX = WIDTH / 2;
const ARC = `M${CX - RX} ${HORIZON} A${RX} ${RY} 0 0 1 ${CX + RX} ${HORIZON}`;

type SunSheetProps = {
    day: DailyPoint;
    /** The day before, for "daylight is X minutes longer". */
    previous: DailyPoint | null;
    isToday: boolean;
    now: number;
    latitude: number;
    longitude: number;
    timezone: string;
    locale: string;
};

/**
 * The sun's day: its arc (with the sun on it right now, for today), first light, sunrise, solar noon, sunset and last
 * light, the length of the day and how it changed since the day before.
 */
export const SunSheet = ({day, previous, isToday, now, latitude, longitude, timezone, locale}: SunSheetProps) => {
    const {t} = useTranslation("weather");
    const clock = (value: number) => formatClock(value, timezone, locale);
    // Twilight and solar noon from the sun's position at midday of the day shown.
    const times = useMemo(() => SunCalc.getTimes(new Date(((day.sunrise + day.sunset) / 2) * 1000), latitude, longitude), [day.sunrise, day.sunset, latitude, longitude]);
    const seconds = (date: Date) => Math.floor(date.getTime() / 1000);
    const {hours, minutes} = splitDuration(day.daylight);
    const change = previous ? Math.round((day.daylight - previous.daylight) / 60) : null;

    const progress = isToday ? dayProgress(now, day.sunrise, day.sunset) : 0.5;
    const isUp = !isToday || (now >= day.sunrise && now <= day.sunset);
    const angle = Math.PI * (1 - progress);
    const sun = {x: CX + RX * Math.cos(angle), y: HORIZON - RY * Math.sin(angle)};

    return (
        <>
            <div className="relative mx-auto mb-5 w-full max-w-md">
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full overflow-visible" aria-hidden>
                    <defs>
                        <linearGradient id="sun-sheet-arc" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#ff9f1c"/>
                            <stop offset="1" stopColor="#ffd978"/>
                        </linearGradient>
                        <linearGradient id="sun-sheet-sky" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#ffc857" stopOpacity="0.18"/>
                            <stop offset="1" stopColor="#ffc857" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <path d={`${ARC} Z`} fill="url(#sun-sheet-sky)"/>
                    <line x1="0" x2={WIDTH} y1={HORIZON} y2={HORIZON} stroke="rgb(255 255 255 / 0.25)" strokeDasharray="2 4"/>
                    <path d={ARC} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="2" strokeDasharray="3 5"/>
                    {isToday && <path d={ARC} fill="none" stroke="url(#sun-sheet-arc)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={`${progress} 1`}/>}
                    <text x={CX - RX} y={HORIZON + 22} textAnchor="middle" className="fill-muted-foreground text-[11px] font-light tabular">{clock(day.sunrise)}</text>
                    <text x={CX + RX} y={HORIZON + 22} textAnchor="middle" className="fill-muted-foreground text-[11px] font-light tabular">{clock(day.sunset)}</text>
                </svg>
                {/* The sun itself is an HTML element so its glow can pulse without repainting the SVG. */}
                <span
                    aria-hidden
                    className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff7d6,#ffb02e)] shadow-[0_0_24px_6px_rgb(255_190_80/0.45)]"
                    style={{left: `${(sun.x / WIDTH) * 100}%`, top: `${(sun.y / HEIGHT) * 100}%`, opacity: isUp ? 1 : 0.35}}
                />
            </div>

            <SheetSection>
                <StatRows
                    rows={[
                        {label: t("sheet.firstLight"), value: clock(seconds(times.dawn))},
                        {label: t("details.sunrise"), value: clock(day.sunrise)},
                        {label: t("sheet.solarNoon"), value: clock(seconds(times.solarNoon))},
                        {label: t("details.sunset"), value: clock(day.sunset)},
                        {label: t("sheet.lastLight"), value: clock(seconds(times.dusk))},
                        {label: t("sheet.daylightLength"), value: t("sheet.duration", {hours, minutes})},
                    ]}
                />
            </SheetSection>

            {change !== null && (
                <SheetSection title={t("sheet.compare")}>
                    <SheetText>{change === 0 ? t("sheet.daylightSame") : t(change > 0 ? "sheet.daylightLonger" : "sheet.daylightShorter", {count: Math.abs(change)})}</SheetText>
                </SheetSection>
            )}

            <SheetSection title={t("sheet.aboutSun")}>
                <SheetText>{t("sheet.about.sun")}</SheetText>
            </SheetSection>
        </>
    );
};
