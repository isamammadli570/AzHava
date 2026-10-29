import type {CSSProperties} from "react";
import {Leaf} from "lucide-react";
import {useTranslation} from "react-i18next";
import {POLLUTANTS, type AirQualityCurrent} from "@/api/airQuality.api";
import {AQI_LEVEL, aqiLevel, formatNumber, type AqiLevel} from "@/helpers/format";
import {Skeleton} from "@/components/ui/skeleton";
import {AnimatedNumber} from "@/widgets/AnimatedNumber";
import {DetailCard, ScaleMarker} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {cn} from "@/lib/utils";

const LEVEL_COLOR: Record<AqiLevel, string> = {
    [AQI_LEVEL.GOOD]: "var(--aqi-good)",
    [AQI_LEVEL.FAIR]: "var(--aqi-fair)",
    [AQI_LEVEL.MODERATE]: "var(--aqi-moderate)",
    [AQI_LEVEL.POOR]: "var(--aqi-poor)",
    [AQI_LEVEL.VERY_POOR]: "var(--aqi-very-poor)",
    [AQI_LEVEL.EXTREMELY_POOR]: "var(--aqi-extremely-poor)",
};

const AQI_SCALE_MAX = 120;
const AQI_GRADIENT = `linear-gradient(90deg, ${Object.values(LEVEL_COLOR).join(", ")})`;

type AirQualityCardProps = {air: AirQualityCurrent | undefined; isLoading: boolean; className?: string; style?: CSSProperties};

/** European AQI with its band, advice and the six pollutants behind it. */
export const AirQualityCard = ({air, isLoading, className, style}: AirQualityCardProps) => {
    const {t} = useTranslation("weather");
    const aqi = air?.european_aqi ?? null;

    if (isLoading) {
        return (
            <DetailCard style={style} className={className} icon={<Leaf/>} title={t("air.title")} info={t("details.info.air")}>
                <Skeleton className="h-10 w-32"/>
                <Skeleton className="mt-4 h-2 w-full"/>
            </DetailCard>
        );
    }

    if (aqi === null || !air) {
        return <DetailCard style={style} className={className} icon={<Leaf/>} title={t("air.title")} info={t("details.info.air")} caption={t("air.unavailable")}/>;
    }

    const level = aqiLevel(aqi);

    return (
        <DetailCard style={style} className={className} icon={<Leaf/>} title={t("air.title")} info={t("details.info.air")}>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                    <p className="flex items-baseline gap-3">
                        <AnimatedNumber value={aqi} className="font-display text-4xl font-semibold"/>
                        <span className="flex items-center gap-1.5 text-lg font-semibold" style={{color: LEVEL_COLOR[level]}}>
                            <span className="size-2.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" aria-hidden/>
                            {t(`air.levels.${level}`)}
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(`air.advice.${level}`)}</p>
                </div>
                <span className="text-xs text-subtle-foreground">{t("air.scale")}</span>
            </div>
            <ScaleMarker className="mt-4" position={(aqi / AQI_SCALE_MAX) * 100} gradient={AQI_GRADIENT}/>
            <dl className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {POLLUTANTS.map((pollutant) => (
                    <div key={pollutant} className="rounded-xl bg-white/6 px-2.5 py-2">
                        <dt className="text-[11px] font-semibold text-subtle-foreground">{t(`air.pollutants.${pollutant}`)}</dt>
                        <dd className={cn("mt-0.5 text-sm font-semibold tabular")}>
                            {formatNumber(air[pollutant], air[pollutant] !== null && (air[pollutant] ?? 0) < 10 ? 1 : 0)}
                            <span className="ml-0.5 text-[10px] font-normal text-subtle-foreground">{t("air.unit")}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        </DetailCard>
    );
};
