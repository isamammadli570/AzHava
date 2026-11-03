import {memo} from "react";
import {ChartNoAxesColumn, Droplets, Eye, Thermometer, Umbrella, SunMedium} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {AirQualityCurrent} from "@/api/airQuality.api";
import type {CurrentWeather} from "@/api/forecast.api";
import {compareWithYesterday} from "@/helpers/advice";
import {formatTemp, roundTemp, uvLevel, UV_LEVEL} from "@/helpers/format";
import {precipitationTotal, type DailyPoint, type HourlyPoint} from "@/helpers/forecast";
import {DetailCard, Meter, ScaleMarker} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {WindCard} from "@/pages/WeatherPage/widgets/DetailsGrid/WindCard";
import {PressureCard} from "@/pages/WeatherPage/widgets/DetailsGrid/PressureCard";
import {SunCard} from "@/pages/WeatherPage/widgets/DetailsGrid/SunCard";
import {AirQualityCard} from "@/pages/WeatherPage/widgets/DetailsGrid/AirQualityCard";
import {cn} from "@/lib/utils";
import {MoonCard} from "@/pages/WeatherPage/widgets/DetailsGrid/MoonCard";

const UV_GRADIENT = `linear-gradient(90deg, var(--uv-low), var(--uv-moderate), var(--uv-high), var(--uv-very-high), var(--uv-extreme))`;
const UV_COLOR = {
    [UV_LEVEL.LOW]: "var(--uv-low)",
    [UV_LEVEL.MODERATE]: "var(--uv-moderate)",
    [UV_LEVEL.HIGH]: "var(--uv-high)",
    [UV_LEVEL.VERY_HIGH]: "var(--uv-very-high)",
    [UV_LEVEL.EXTREME]: "var(--uv-extreme)",
};

const visibilityLevel = (meters: number): "clear" | "moderate" | "poor" => {
    if (meters >= 10_000) return "clear";
    if (meters >= 4000) return "moderate";
    return "poor";
};

type DetailsGridProps = {
    current: CurrentWeather;
    today: DailyPoint | undefined;
    yesterday: DailyPoint | null;
    hours: HourlyPoint[];
    timezone: string;
    utcOffset: number;
    latitude: number;
    longitude: number;
    air: AirQualityCurrent | undefined;
    isAirLoading: boolean;
};

/**
 * The "everything else" tiles: small squares paired two by two, wide tiles (wind, moon, air) across the row.
 * `grid-flow-row-dense` back-fills any hole the wide tiles leave. Each tile rises in as it scrolls into view.
 */
export const DetailsGrid = memo(({current, today, yesterday, hours, timezone, utcOffset, latitude, longitude, air, isAirLoading}: DetailsGridProps) => {
    const {t} = useTranslation("weather");
    const feelsDelta = current.apparent_temperature - current.temperature_2m;
    const feelsKey = Math.abs(feelsDelta) < 2 ? "feelsSame" : feelsDelta > 0 ? "feelsWarmer" : "feelsColder";
    const uv = uvLevel(current.uv_index);
    const next24 = hours.slice(0, 24);
    const next12 = hours.slice(0, 12);
    const visibilityKm = current.visibility / 1000;
    const comparison = today && yesterday ? compareWithYesterday(today.max, yesterday.max) : null;

    return (
        <section aria-labelledby="details-title" className="[grid-area:details]">
            <h2 id="details-title" className="sr-only">{t("details.title")}</h2>
            <div className="grid grid-flow-row-dense grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <DetailCard
                    icon={<Thermometer/>}
                    title={t("details.feelsLike")}
                    value={roundTemp(current.apparent_temperature)}
                    unit="°"
                    caption={t(`details.${feelsKey}`)}
                    sheet="conditions"
                    sheetMode="feels"
                >
                    <Meter value={((current.apparent_temperature + 20) / 65) * 100} barClassName="bg-gradient-to-r from-accent via-brand to-danger"/>
                </DetailCard>

                <DetailCard
                    icon={<SunMedium/>}
                    title={t("details.uv")}
                    value={current.uv_index}
                    decimals={current.uv_index < 10 ? 1 : 0}
                    caption={t(`details.uvAdvice.${uv}`)}
                    sheet="uv"
                >
                    <p className="mb-3 text-[11px] font-light tracking-[0.24em] uppercase" style={{color: UV_COLOR[uv]}}>{t(`details.uvLevels.${uv}`)}</p>
                    <ScaleMarker position={(current.uv_index / 11) * 100} gradient={UV_GRADIENT}/>
                </DetailCard>

                <DetailCard
                    icon={<Droplets/>}
                    title={t("details.humidity")}
                    value={current.relative_humidity_2m}
                    unit="%"
                    caption={t("details.dewPoint", {temp: formatTemp(current.dew_point_2m)})}
                    sheet="humidity"
                >
                    <Meter value={current.relative_humidity_2m} barClassName="bg-gradient-to-r from-accent/60 to-accent"/>
                </DetailCard>

                <WindCard className="col-span-2" speed={current.wind_speed_10m} gusts={current.wind_gusts_10m} direction={current.wind_direction_10m}/>

                <PressureCard pressure={current.pressure_msl}/>


                <DetailCard
                    icon={<Umbrella/>}
                    title={t("details.precipitation")}
                    value={precipitationTotal(next24)}
                    decimals={1}
                    unit={t("details.mm")}
                    caption={`${t("details.next24h")} · ${t("details.chance", {chance: today?.precipitationProbability ?? 0})}`}
                    sheet="conditions"
                >
                    <div aria-hidden className="flex h-10 items-end gap-1">
                        {next12.map((hour, index) => (
                            <span
                                key={hour.time}
                                className="flex-1 origin-bottom animate-[grow-up_700ms_var(--ease-out)_both] rounded-sm bg-gradient-to-t from-accent/40 to-accent"
                                style={{height: `${Math.max(6, hour.precipitationProbability)}%`, opacity: hour.precipitationProbability > 0 ? 1 : 0.3, animationDelay: `${index * 45}ms`}}
                            />
                        ))}
                    </div>
                </DetailCard>

                {today && <SunCard sunrise={today.sunrise} sunset={today.sunset} daylight={today.daylight} timezone={timezone}/>}

                <DetailCard
                    icon={<Eye/>}
                    title={t("details.visibility")}
                    value={visibilityKm}
                    decimals={visibilityKm >= 10 ? 0 : 1}
                    unit={t("details.km")}
                    caption={t(`details.visibilityLevels.${visibilityLevel(current.visibility)}`)}
                    sheet="visibility"
                >
                    <Meter value={(current.visibility / 30_000) * 100} barClassName="bg-gradient-to-r from-white/40 to-white"/>
                </DetailCard>

                <MoonCard className="col-span-2" latitude={latitude} longitude={longitude} utcOffset={utcOffset} timezone={timezone}/>

                {comparison && yesterday && today && (
                    <DetailCard
                        icon={<ChartNoAxesColumn/>}
                        title={t("details.vsYesterday.title")}
                        value={`${comparison.trend === "colder" ? "−" : comparison.trend === "warmer" ? "+" : ""}${comparison.delta}°`}
                        caption={t(`details.vsYesterday.${comparison.trend === "warmer" ? "higher" : comparison.trend === "colder" ? "lower" : "same"}`, {delta: comparison.delta})}
                        sheet="conditions"
                    >
                        <ComparisonBars yesterday={yesterday.max} today={today.max}/>
                    </DetailCard>
                )}

                <AirQualityCard className="col-span-2 lg:col-span-4" air={air} isLoading={isAirLoading}/>
            </div>
        </section>
    );
});

type ComparisonBarsProps = {yesterday: number; today: number};

/** The highs of yesterday and today as two bars on a shared scale, today in the warm accent. */
const ComparisonBars = ({yesterday, today}: ComparisonBarsProps) => {
    const {t} = useTranslation("weather");
    const low = Math.min(yesterday, today) - 6;
    const span = Math.max(yesterday, today) - low || 1;
    const rows = [
        {label: t("details.vsYesterday.yesterday"), value: yesterday, className: "bg-white/35"},
        {label: t("details.vsYesterday.today"), value: today, className: "bg-gradient-to-r from-accent to-brand"},
    ];

    return (
        <div className="space-y-1.5">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-12 shrink-0 truncate">{row.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/20">
                        <span className={cn("block h-full origin-left animate-bar-grow rounded-full", row.className)} style={{width: `${((row.value - low) / span) * 100}%`}}/>
                    </span>
                    <span className="w-8 shrink-0 text-right text-foreground tabular">{formatTemp(row.value)}</span>
                </div>
            ))}
        </div>
    );
};
