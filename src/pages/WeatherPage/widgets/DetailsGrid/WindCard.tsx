import type {CSSProperties} from "react";
import {Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {compassPoint} from "@/helpers/format";
import {DetailCard} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";

const CARDINALS = [
    {key: "N", angle: 0},
    {key: "E", angle: 90},
    {key: "S", angle: 180},
    {key: "W", angle: 270},
] as const;

type WindCardProps = {speed: number; gusts: number; direction: number; style?: CSSProperties};

/** Compass dial; the arrow points where the wind is blowing to, the label names where it comes from. */
export const WindCard = ({speed, gusts, direction, style}: WindCardProps) => {
    const {t} = useTranslation("weather");
    const from = t(`compass.${compassPoint(direction)}`);

    return (
        <DetailCard style={style} icon={<Wind/>} title={t("details.wind")} value={Math.round(speed)} unit={t("details.kmh")} info={t("details.info.wind")} caption={`${t("details.from", {direction: from})} · ${t("details.gusts", {speed: Math.round(gusts)})}`}>
            <svg viewBox="0 0 100 100" className="mx-auto size-24 sm:size-28" role="img" aria-label={t("details.from", {direction: from})}>
                <circle cx="50" cy="50" r="46" fill="rgb(255 255 255 / 0.05)" stroke="rgb(255 255 255 / 0.18)"/>
                {Array.from({length: 36}, (_, index) => {
                    const isMajor = index % 9 === 0;
                    return <line key={index} x1="50" y1="5" x2="50" y2={isMajor ? 12 : 9} stroke={isMajor ? "rgb(255 255 255 / 0.7)" : "rgb(255 255 255 / 0.25)"} strokeWidth={isMajor ? 1.6 : 1} transform={`rotate(${index * 10} 50 50)`}/>;
                })}
                {CARDINALS.map(({key, angle}) => {
                    const radians = ((angle - 90) * Math.PI) / 180;
                    return (
                        <text key={key} x={50 + Math.cos(radians) * 30} y={50 + Math.sin(radians) * 30 + 3.5} textAnchor="middle" className={key === "N" ? "fill-brand text-[10px] font-bold" : "fill-muted-foreground text-[9px] font-semibold"}>
                            {t(`compassShort.${key}`)}
                        </text>
                    );
                })}
                <g className="transition-transform duration-1000 ease-(--ease-spring)" style={{transform: `rotate(${direction + 180}deg)`, transformOrigin: "50px 50px"}}>
                    <line x1="50" y1="76" x2="50" y2="28" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M50 18l7 12h-14z" fill="var(--brand)"/>
                    <circle cx="50" cy="78" r="3" fill="none" stroke="#fff" strokeWidth="2"/>
                </g>
                <circle cx="50" cy="50" r="3.5" fill="#fff"/>
            </svg>
        </DetailCard>
    );
};
