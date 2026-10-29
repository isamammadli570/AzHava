import type {CSSProperties} from "react";
import {Sunrise, Sunset} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {dayProgress, splitDuration} from "@/helpers/format";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {DetailCard} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {cn} from "@/lib/utils";

const WIDTH = 200;
const HEIGHT = 92;
const RADIUS_X = 84;
const RADIUS_Y = 70;
const CENTER_X = WIDTH / 2;
const HORIZON = 80;
const ARC = `M${CENTER_X - RADIUS_X} ${HORIZON} A${RADIUS_X} ${RADIUS_Y} 0 0 1 ${CENTER_X + RADIUS_X} ${HORIZON}`;

type SunCardProps = {sunrise: number; sunset: number; daylight: number; timezone: string; className?: string; style?: CSSProperties};

/** Sunrise and sunset with the sun travelling along its arc in real time. */
export const SunCard = ({sunrise, sunset, daylight, timezone, className, style}: SunCardProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const now = useNow(60_000);
    const progress = dayProgress(now, sunrise, sunset);
    const isUp = now >= sunrise && now <= sunset;
    const angle = Math.PI * (1 - progress);
    const sun = {x: CENTER_X + RADIUS_X * Math.cos(angle), y: HORIZON - RADIUS_Y * Math.sin(angle)};
    const {hours, minutes} = splitDuration(daylight);

    return (
        <DetailCard style={style} className={className} icon={<Sunrise/>} title={t("details.sun")} caption={t("details.daylight", {hours, minutes})} info={t("details.info.sun")}>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-72 self-center overflow-visible" aria-hidden>
                <defs>
                    <linearGradient id="sun-arc" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#ff9f1c"/>
                        <stop offset="1" stopColor="#ffd978"/>
                    </linearGradient>
                    <radialGradient id="sun-dot">
                        <stop offset="0" stopColor="#fff7d6"/>
                        <stop offset="1" stopColor="#ffb02e"/>
                    </radialGradient>
                </defs>
                <line x1="4" x2={WIDTH - 4} y1={HORIZON} y2={HORIZON} stroke="rgb(255 255 255 / 0.25)" strokeDasharray="2 4"/>
                <path d={ARC} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="2" strokeDasharray="3 5"/>
                <path d={ARC} fill="none" stroke="url(#sun-arc)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={`${progress} 1`} className="transition-[stroke-dasharray] duration-1000"/>
                <g className={cn("transition-opacity duration-500", isUp ? "opacity-100" : "opacity-40")}>
                    <circle cx={sun.x} cy={sun.y} r="14" fill="#ffc857" opacity=".25" className="animate-[glow-pulse_4s_ease-in-out_infinite] [transform-box:fill-box] [transform-origin:center]"/>
                    <circle cx={sun.x} cy={sun.y} r="7" fill="url(#sun-dot)"/>
                </g>
            </svg>
            <div className="mt-2 flex justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5">
                    <Sunrise className="size-4 text-brand" aria-hidden/>
                    <span className="sr-only">{t("details.sunrise")}</span>
                    <span className="font-semibold tabular">{formatClock(sunrise, timezone, locale)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="sr-only">{t("details.sunset")}</span>
                    <span className="font-semibold tabular">{formatClock(sunset, timezone, locale)}</span>
                    <Sunset className="size-4 text-brand" aria-hidden/>
                </span>
            </div>
        </DetailCard>
    );
};
