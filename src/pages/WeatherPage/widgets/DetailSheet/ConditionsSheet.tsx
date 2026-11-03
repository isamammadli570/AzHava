import {useState} from "react";
import {Droplet, Snowflake} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {peakOf, sumOf, type DetailHour} from "@/helpers/detail";
import {formatNumber, formatTemp} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import {CONDITION, conditionFromCode, weatherLabelKey} from "@/helpers/weather";
import type {TemperatureMode} from "@/hooks/useDetailSheet";
import {SegmentedControl} from "@/widgets/SegmentedControl";
import {WeatherGlyph} from "@/widgets/WeatherGlyph";
import {SheetChart} from "@/pages/WeatherPage/widgets/DetailSheet/SheetChart";
import {Headline, SheetSection, SheetText, StatRows} from "@/pages/WeatherPage/widgets/DetailSheet/parts";

type ConditionsSheetProps = {
    day: DailyPoint;
    hours: DetailHour[];
    isToday: boolean;
    now: number;
    mode: TemperatureMode;
    onModeChange: (mode: TemperatureMode) => void;
    timezone: string;
    locale: string;
};

const temperatureOf = (mode: TemperatureMode) => (hour: DetailHour) => (mode === "feels" ? hour.apparentTemperature : hour.temperature);

/**
 * The day's weather in depth: temperature through the hours (real or feels-like, the other one faint behind it),
 * the chance of rain hour by hour, how much falls, and a plain-language summary of the day.
 */
export const ConditionsSheet = ({day, hours, isToday, now, mode, onModeChange, timezone, locale}: ConditionsSheetProps) => {
    const {t} = useTranslation("weather");
    const [active, setActive] = useState<number | null>(null);
    const pick = temperatureOf(mode);
    const activeHour = active !== null ? hours[active] : null;
    const clock = (time: number) => formatClock(time, timezone, locale);

    const warmest = peakOf(hours, pick);
    const coolest = peakOf(hours, pick, true);
    const wettest = peakOf(hours, (hour) => hour.precipitationProbability);
    const total = sumOf(hours, (hour) => hour.precipitation);
    const isSnow = hours.some((hour) => conditionFromCode(hour.weatherCode) === CONDITION.SNOW && hour.precipitation > 0);

    const range = warmest && coolest ? {min: formatTemp(coolest.value), max: formatTemp(warmest.value)} : null;
    const summary = [
        range && warmest ? t(mode === "feels" ? "sheet.summary.feels" : "sheet.summary.temperature", {...range, time: clock(warmest.time)}) : null,
        wettest && wettest.value >= 20
            ? t("sheet.summary.rainPeak", {time: clock(wettest.time), chance: wettest.value})
            : t("sheet.summary.dry"),
        total >= 0.1 ? t(isSnow ? "sheet.summary.snowTotal" : "sheet.summary.rainTotal", {amount: formatNumber(total, 1)}) : null,
    ].filter(Boolean).join(" ");

    return (
        <>
            <Headline
                value={activeHour ? formatTemp(pick(activeHour)) : `${formatTemp(day.max)} ${formatTemp(day.min)}`}
                label={activeHour ? `${clock(activeHour.time)} · ${t(weatherLabelKey(activeHour.weatherCode))}` : t(weatherLabelKey(day.weatherCode))}
                aside={<WeatherGlyph code={activeHour?.weatherCode ?? day.weatherCode} isDay={activeHour ? activeHour.isDay : true} size={40}/>}
            />

            <SheetSection>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-light tracking-[0.18em] text-muted-foreground uppercase">{t(mode === "feels" ? "sheet.feelsTitle" : "sheet.temperatureTitle")}</p>
                    <SegmentedControl
                        label={t("sheet.temperatureTitle")}
                        value={mode}
                        onChange={onModeChange}
                        options={[{value: "actual", label: t("sheet.actual")}, {value: "feels", label: t("sheet.feels")}]}
                    />
                </div>
                <SheetChart
                    times={hours.map((hour) => hour.time)}
                    series={[{values: hours.map(pick)}, ...(mode === "feels" ? [{values: hours.map((hour) => hour.temperature), dashed: true}] : [])]}
                    format={(value) => `${Math.round(value)}°`}
                    color="rgb(var(--tint))"
                    timezone={timezone}
                    locale={locale}
                    now={isToday ? now : undefined}
                    showExtremes
                    renderAbove={(index) => <WeatherGlyph code={hours[index].weatherCode} isDay={hours[index].isDay} size={15}/>}
                    label={t("sheet.temperatureChart")}
                    onActiveChange={setActive}
                />
            </SheetSection>

            <SheetSection title={t("sheet.precipChance")}>
                <p className="mb-3 text-[13px] font-light text-muted-foreground">
                    {activeHour ? t("sheet.chanceAt", {time: clock(activeHour.time), chance: activeHour.precipitationProbability}) : t("sheet.chanceOfDay", {chance: day.precipitationProbability})}
                </p>
                <SheetChart
                    times={hours.map((hour) => hour.time)}
                    series={[{values: hours.map((hour) => hour.precipitationProbability)}]}
                    kind="bars"
                    domain={[0, 100]}
                    format={(value) => `${Math.round(value)}%`}
                    color="var(--accent)"
                    timezone={timezone}
                    locale={locale}
                    now={isToday ? now : undefined}
                    height={130}
                    label={t("sheet.precipChart")}
                    onActiveChange={setActive}
                />
            </SheetSection>

            <SheetSection title={t("sheet.totalPrecip")}>
                <StatRows
                    rows={[
                        {
                            label: (
                                <span className="flex items-center gap-2">
                                    {isSnow ? <Snowflake className="size-4 text-accent" aria-hidden/> : <Droplet className="size-4 text-accent" aria-hidden/>}
                                    {t(isSnow ? "sheet.snow" : "sheet.rain")}
                                </span>
                            ),
                            value: `${formatNumber(total, 1)} ${t("details.mm")}`,
                        },
                    ]}
                />
            </SheetSection>

            <SheetSection title={t("sheet.daySummary")}>
                <SheetText>{summary}</SheetText>
            </SheetSection>

            <SheetSection title={t(mode === "feels" ? "sheet.aboutFeels" : "sheet.aboutTemperature")}>
                <SheetText>{t(mode === "feels" ? "sheet.about.feels" : "sheet.about.temperature")}</SheetText>
            </SheetSection>
        </>
    );
};
