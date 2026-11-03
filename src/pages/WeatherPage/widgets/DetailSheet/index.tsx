import {lazy, Suspense, useState, type ReactNode} from "react";
import {CloudSun, Droplets, Eye, Gauge, Moon, Sunrise, SunMedium, Umbrella, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {DETAIL_DAYS, type CurrentWeather} from "@/api/forecast.api";
import {ERRORS} from "@/constants/errors";
import {formatWeekday, localDateKey} from "@/helpers/dates";
import {hoursOfDay} from "@/helpers/detail";
import {clamp} from "@/helpers/format";
import type {DailyPoint} from "@/helpers/forecast";
import type {Place} from "@/helpers/place";
import {useGetHourlyDetail} from "@/hooks/forecast";
import {useDetailSheet, type SheetKind} from "@/hooks/useDetailSheet";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {Skeleton} from "@/components/ui/skeleton";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {ConditionsSheet} from "@/pages/WeatherPage/widgets/DetailSheet/ConditionsSheet";
import {DayPicker} from "@/pages/WeatherPage/widgets/DetailSheet/DayPicker";
import {MetricSheet} from "@/pages/WeatherPage/widgets/DetailSheet/MetricSheet";
import {MoonSheet} from "@/pages/WeatherPage/widgets/DetailSheet/MoonSheet";
import {SheetShell} from "@/pages/WeatherPage/widgets/DetailSheet/SheetShell";
import {SunSheet} from "@/pages/WeatherPage/widgets/DetailSheet/SunSheet";
import {WindSheet} from "@/pages/WeatherPage/widgets/DetailSheet/WindSheet";

const HEADERS: Record<SheetKind, {icon: ReactNode; title: string}> = {
    conditions: {icon: <CloudSun/>, title: "sheet.conditionsTitle"},
    wind: {icon: <Wind/>, title: "details.wind"},
    moon: {icon: <Moon/>, title: "sheet.moonTitle"},
    sun: {icon: <Sunrise/>, title: "details.sun"},
    uv: {icon: <SunMedium/>, title: "details.uv"},
    humidity: {icon: <Droplets/>, title: "details.humidity"},
    visibility: {icon: <Eye/>, title: "details.visibility"},
    pressure: {icon: <Gauge/>, title: "details.pressure"},
    radar: {icon: <Umbrella/>, title: "radar.mapTitle"},
};

/** The full map comes with the map library, loaded only when it is opened. */
const RadarExplorer = lazy(() => import("@/pages/WeatherPage/widgets/RadarExplorer"));

/** Sheets that read the hour-by-hour detail (the moon and sun sheets are computed on the spot). */
const NEEDS_HOURS: ReadonlySet<SheetKind> = new Set(["conditions", "wind", "uv", "humidity", "visibility", "pressure"]);

type DetailSheetHostProps = {place: Place; current: CurrentWeather; daily: DailyPoint[]; yesterday: DailyPoint | null; timezone: string; utcOffset: number};

/**
 * Shows whichever detail sheet the address asks for. The last sheet stays rendered while the closing animation runs,
 * and the hourly detail is fetched only once a sheet that needs it opens.
 */
export const DetailSheetHost = ({place, current, daily, yesterday, timezone, utcOffset}: DetailSheetHostProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const {sheet, day, mode, setDay, setMode, close} = useDetailSheet();
    const [shown, setShown] = useState<SheetKind | null>(sheet);
    if (sheet && sheet !== shown) setShown(sheet);
    const kind = sheet ?? shown;
    const now = useNow(60_000);
    const detail = useGetHourlyDetail(place, kind !== null && NEEDS_HOURS.has(kind));

    if (!kind) return null;
    if (kind === "radar") {
        return (
            <Suspense fallback={null}>
                <RadarExplorer open={sheet !== null} onClose={close} place={place} current={current} timezone={timezone}/>
            </Suspense>
        );
    }

    const days = daily.slice(0, DETAIL_DAYS);
    const dayIndex = clamp(day, 0, Math.max(0, days.length - 1));
    const selected = days[dayIndex];
    const previous = dayIndex > 0 ? days[dayIndex - 1] : yesterday;
    const hoursFor = (target: DailyPoint | null | undefined) => (target ? hoursOfDay(detail.hours, localDateKey(target.time, timezone), timezone) : []);
    const isToday = dayIndex === 0;

    const body = () => {
        if (kind === "moon") return <MoonSheet now={now} latitude={place.latitude} longitude={place.longitude} utcOffset={utcOffset} timezone={timezone} locale={locale}/>;
        if (!selected) return null;
        if (kind === "sun") {
            return <SunSheet day={selected} previous={previous} isToday={isToday} now={now} latitude={place.latitude} longitude={place.longitude} timezone={timezone} locale={locale}/>;
        }
        if (detail.isError) return <QueryErrorState message={t(ERRORS.FORECAST)} onRetry={() => void detail.refetch()}/>;
        const hours = hoursFor(selected);
        if (detail.isPending || hours.length === 0) return <SheetSkeleton/>;

        if (kind === "conditions") {
            return <ConditionsSheet day={selected} hours={hours} isToday={isToday} now={now} mode={mode} onModeChange={setMode} timezone={timezone} locale={locale}/>;
        }
        if (kind === "wind") {
            const previousLabel = isToday ? t("details.vsYesterday.yesterday") : previous ? formatWeekday(previous.time, timezone, locale) : "";
            return <WindSheet hours={hours} previousHours={hoursFor(previous)} previousLabel={previousLabel} dayLabel={isToday ? t("common:today") : formatWeekday(selected.time, timezone, locale)} isToday={isToday} now={now} timezone={timezone} locale={locale}/>;
        }
        return <MetricSheet metric={kind} hours={hours} isToday={isToday} now={now} timezone={timezone} locale={locale}/>;
    };

    return (
        <SheetShell open={sheet !== null} onClose={close} icon={HEADERS[kind].icon} title={t(HEADERS[kind].title)} isNight={kind === "moon"}>
            {kind !== "moon" && <DayPicker days={days} selected={dayIndex} onSelect={setDay} timezone={timezone} locale={locale}/>}
            {/* Keyed by sheet and day, so each change re-runs the entrance (charts draw in again). */}
            <div key={`${kind}-${dayIndex}`} className="animate-[fade-in_320ms_var(--ease-out)]">
                {body()}
            </div>
        </SheetShell>
    );
};

/** Placeholder while the hourly detail loads: headline, chart and two panels. */
const SheetSkeleton = () => (
    <div aria-hidden className="space-y-5">
        <Skeleton className="h-12 w-40 rounded-xl"/>
        <Skeleton className="h-56 w-full rounded-2xl"/>
        <Skeleton className="h-36 w-full rounded-2xl"/>
        <Skeleton className="h-24 w-full rounded-2xl"/>
    </div>
);
