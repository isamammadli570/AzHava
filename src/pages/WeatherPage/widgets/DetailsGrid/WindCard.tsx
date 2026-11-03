import type {CSSProperties} from "react";
import {Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {compassPoint} from "@/helpers/format";
import {DetailCard} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {cn} from "@/lib/utils";

const CARDINALS = [
    {key: "N", angle: 0},
    {key: "E", angle: 90},
    {key: "S", angle: 180},
    {key: "W", angle: 270},
] as const;

type WindCardProps = {speed: number; gusts: number; direction: number; className?: string; style?: CSSProperties};

/**
 * Wide wind tile: speed, gusts and direction as a short list, next to a compass whose arrow shows where the wind
 * blows to, with the speed in its middle.
 */
export const WindCard = ({speed, gusts, direction, className, style}: WindCardProps) => {
    const {t} = useTranslation("weather");
    const point = compassPoint(direction);
    const rows = [
        {label: t("details.windSpeed"), value: `${Math.round(speed)} ${t("details.kmh")}`},
        {label: t("details.gustsLabel"), value: `${Math.round(gusts)} ${t("details.kmh")}`},
        {label: t("details.direction"), value: `${Math.round(direction)}° ${t(`compassAbbr.${point}`)}`},
    ];

    return (
        <DetailCard style={style} className={cn("min-h-0", className)} icon={<Wind/>} title={t("details.wind")} sheet="wind">
            <div className="flex items-center gap-4">
                <dl className="min-w-0 flex-1">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 text-[14px] font-light last:border-b-0">
                            <dt className="truncate text-muted-foreground">{row.label}</dt>
                            <dd className="shrink-0 tracking-[0.06em] tabular">{row.value}</dd>
                        </div>
                    ))}
                </dl>
                <svg viewBox="0 0 100 100" className="size-32 shrink-0 sm:size-36" role="img" aria-label={t("details.from", {direction: t(`compass.${point}`)})}>
                    {Array.from({length: 60}, (_, index) => {
                        const isMajor = index % 15 === 0;
                        return (
                            <line
                                key={index}
                                x1="50"
                                y1="3"
                                x2="50"
                                y2={isMajor ? 10 : 7.5}
                                stroke={isMajor ? "rgb(255 255 255 / 0.75)" : "rgb(255 255 255 / 0.28)"}
                                strokeWidth={isMajor ? 1.4 : 0.8}
                                transform={`rotate(${index * 6} 50 50)`}
                            />
                        );
                    })}
                    {CARDINALS.map(({key, angle}) => {
                        const radians = ((angle - 90) * Math.PI) / 180;
                        return (
                            <text key={key} x={50 + Math.cos(radians) * 33} y={50 + Math.sin(radians) * 33 + 3.2} textAnchor="middle" className="fill-muted-foreground text-[8px] font-light">
                                {t(`compassShort.${key}`)}
                            </text>
                        );
                    })}
                    <g className="transition-transform duration-1000 ease-(--ease-spring)" style={{transform: `rotate(${direction + 180}deg)`, transformOrigin: "50px 50px"}}>
                        <line x1="50" y1="86" x2="50" y2="68" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                        <circle cx="50" cy="88" r="3" fill="#fff"/>
                        <line x1="50" y1="32" x2="50" y2="18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                        <path d="M50 10l5.5 9h-11z" fill="#fff"/>
                    </g>
                    <text x="50" y="50" textAnchor="middle" className="fill-foreground text-[19px] font-extralight tabular">{Math.round(speed)}</text>
                    <text x="50" y="61" textAnchor="middle" className="fill-muted-foreground text-[6.5px] font-light tracking-[0.12em] uppercase">{t("details.kmh")}</text>
                </svg>
            </div>
        </DetailCard>
    );
};
