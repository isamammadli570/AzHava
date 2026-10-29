import type {CSSProperties} from "react";
import {Gauge} from "lucide-react";
import {useTranslation} from "react-i18next";
import {clamp, pressureLevel} from "@/helpers/format";
import {DetailCard} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";

const MIN_HPA = 970;
const MAX_HPA = 1050;
const SWEEP = 240;
const START = -120;

const polar = (angle: number, radius: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {x: 50 + Math.cos(radians) * radius, y: 54 + Math.sin(radians) * radius};
};

const arc = (from: number, to: number, radius: number): string => {
    const start = polar(from, radius);
    const end = polar(to, radius);
    return `M${start.x} ${start.y} A${radius} ${radius} 0 ${to - from > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;
};

type PressureCardProps = {pressure: number; style?: CSSProperties};

/** Barometer-style gauge from 970 to 1050 hPa with the needle on the sea-level pressure. */
export const PressureCard = ({pressure, style}: PressureCardProps) => {
    const {t} = useTranslation("weather");
    const ratio = clamp((pressure - MIN_HPA) / (MAX_HPA - MIN_HPA), 0, 1);
    const angle = START + ratio * SWEEP;

    return (
        <DetailCard style={style} icon={<Gauge/>} title={t("details.pressure")} value={Math.round(pressure)} unit={t("details.hpa")} info={t("details.info.pressure")} caption={t(`details.pressureLevels.${pressureLevel(pressure)}`)}>
            <svg viewBox="0 0 100 80" className="mx-auto h-20 w-28 sm:h-24 sm:w-32" aria-hidden>
                <path d={arc(START, START + SWEEP, 40)} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="7" strokeLinecap="round"/>
                <path d={arc(START, START + SWEEP, 40)} fill="none" stroke="url(#pressure-gradient)" strokeWidth="7" strokeLinecap="round" pathLength={1} strokeDasharray={`${ratio} 1`} className="transition-[stroke-dasharray] duration-1000"/>
                <defs>
                    <linearGradient id="pressure-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="var(--accent)"/>
                        <stop offset="1" stopColor="var(--brand)"/>
                    </linearGradient>
                </defs>
                <g className="transition-transform duration-1000 ease-(--ease-spring)" style={{transform: `rotate(${angle}deg)`, transformOrigin: "50px 54px"}}>
                    <line x1="50" y1="54" x2="50" y2="24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                </g>
                <circle cx="50" cy="54" r="4" fill="#fff"/>
            </svg>
        </DetailCard>
    );
};
