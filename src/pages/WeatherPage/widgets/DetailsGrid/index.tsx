import {Droplets, Eye, Thermometer, Umbrella, SunMedium} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {AirQualityCurrent} from "@/api/airQuality.api";
import type {CurrentWeather} from "@/api/forecast.api";
import {formatTemp, roundTemp, uvLevel, UV_LEVEL} from "@/helpers/format";
import {precipitationTotal, type DailyPoint, type HourlyPoint} from "@/helpers/forecast";
import {DetailCard, Meter, ScaleMarker} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {WindCard} from "@/pages/WeatherPage/widgets/DetailsGrid/WindCard";
import {PressureCard} from "@/pages/WeatherPage/widgets/DetailsGrid/PressureCard";
import {SunCard} from "@/pages/WeatherPage/widgets/DetailsGrid/SunCard";
import {AirQualityCard} from "@/pages/WeatherPage/widgets/DetailsGrid/AirQualityCard";

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
    hours: HourlyPoint[];
    timezone: string;
    air: AirQualityCurrent | undefined;
    isAirLoading: boolean;
};

/** The "everything else" tiles under the hourly chart; each one rises in as it scrolls into view. */
export const DetailsGrid = ({current, today, hours, timezone, air, isAirLoading}: DetailsGridProps) => {
    const {t} = useTranslation("weather");
    const feelsDelta = current.apparent_temperature - current.temperature_2m;
    const feelsKey = Math.abs(feelsDelta) < 2 ? "feelsSame" : feelsDelta > 0 ? "feelsWarmer" : "feelsColder";
    const uv = uvLevel(current.uv_index);
    const next24 = hours.slice(0, 24);
    const next12 = hours.slice(0, 12);
    const visibilityKm = current.visibility / 1000;

    return (
        <section aria-labelledby="details-title" className="[grid-area:details]">
            <h2 id="details-title" className="sr-only">{t("details.title")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                <DetailCard
                    icon={<Thermometer/>}
                    title={t("details.feelsLike")}
                    value={roundTemp(current.apparent_temperature)}
                    unit="°"
                    caption={t(`details.${feelsKey}`)}
                    info={t("details.info.feelsLike")}
                >
                    <Meter value={((current.apparent_temperature + 20) / 65) * 100} barClassName="bg-gradient-to-r from-accent via-brand to-danger"/>
                </DetailCard>

                <DetailCard
                    icon={<Droplets/>}
                    title={t("details.humidity")}
                    value={current.relative_humidity_2m}
                    unit="%"
                    caption={t("details.dewPoint", {temp: formatTemp(current.dew_point_2m)})}
                    info={t("details.info.humidity")}
                >
                    <Meter value={current.relative_humidity_2m} barClassName="bg-gradient-to-r from-accent/60 to-accent"/>
                </DetailCard>

                <WindCard speed={current.wind_speed_10m} gusts={current.wind_gusts_10m} direction={current.wind_direction_10m}/>

                <PressureCard pressure={current.pressure_msl}/>

                <DetailCard
                    icon={<SunMedium/>}
                    title={t("details.uv")}
                    value={current.uv_index}
                    decimals={current.uv_index < 10 ? 1 : 0}
                    caption={t(`details.uvAdvice.${uv}`)}
                    info={t("details.info.uv")}
                >
                    <p className="mb-2 text-sm font-semibold" style={{color: UV_COLOR[uv]}}>{t(`details.uvLevels.${uv}`)}</p>
                    <ScaleMarker position={(current.uv_index / 11) * 100} gradient={UV_GRADIENT}/>
                </DetailCard>

                <DetailCard
                    icon={<Umbrella/>}
                    title={t("details.precipitation")}
                    value={precipitationTotal(next24)}
                    decimals={1}
                    unit={t("details.mm")}
                    caption={`${t("details.next24h")} · ${t("details.chance", {chance: today?.precipitationProbability ?? 0})}`}
                    info={t("details.info.precipitation")}
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

                {today && <SunCard className="xl:col-span-2" sunrise={today.sunrise} sunset={today.sunset} daylight={today.daylight} timezone={timezone}/>}

                <DetailCard
                    icon={<Eye/>}
                    title={t("details.visibility")}
                    value={visibilityKm}
                    decimals={visibilityKm >= 10 ? 0 : 1}
                    unit={t("details.km")}
                    caption={t(`details.visibilityLevels.${visibilityLevel(current.visibility)}`)}
                    info={t("details.info.visibility")}
                >
                    <Meter value={(current.visibility / 30_000) * 100} barClassName="bg-gradient-to-r from-white/40 to-white"/>
                </DetailCard>

                <AirQualityCard className="col-span-2 xl:col-span-3" air={air} isLoading={isAirLoading}/>
            </div>
        </section>
    );
};
