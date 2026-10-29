import {useCallback, useMemo, useState} from "react";
import {CalendarDays} from "lucide-react";
import {useTranslation} from "react-i18next";
import {DAILY_RANGES, type DailyRange} from "@/constants/other";
import {temperatureBounds, type DailyPoint} from "@/helpers/forecast";
import {useLanguage} from "@/hooks/useLanguage";
import {Card, CardHeader} from "@/components/ui/card";
import {SegmentedControl} from "@/widgets/SegmentedControl";
import {DailyRow} from "@/pages/WeatherPage/widgets/DailyForecast/DailyRow";
import {staggerIndex} from "@/lib/utils";

type DailyForecastProps = {days: DailyPoint[]; timezone: string; currentTemp: number; placeId: string};

/** 7 or 16 days, every range bar on one shared scale so warm and cold days compare honestly. */
export const DailyForecast = ({days, timezone, currentTemp, placeId}: DailyForecastProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const [range, setRange] = useState<DailyRange>(7);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const items = useMemo(() => days.slice(0, range), [days, range]);
    const bounds = useMemo(() => temperatureBounds(items), [items]);
    // The model horizon sometimes ends a day early (last day all null), so the label shows what is really there.
    const rangeOptions = DAILY_RANGES.map((value) => ({value, label: t("daily.range", {count: Math.min(value, days.length)})}));

    const toggle = useCallback((index: number) => setOpenIndex((open) => (open === index ? null : index)), []);

    return (
        <Card aria-labelledby="daily-title" className="[grid-area:daily] lg:sticky lg:top-4 lg:self-start">
            <CardHeader
                id="daily-title"
                icon={<CalendarDays/>}
                title={t("daily.title")}
                actions={<SegmentedControl options={rangeOptions} value={range} onChange={setRange} label={t("daily.title")}/>}
            />
            <ol key={`${placeId}-${range}`} aria-label={t("daily.listLabel", {count: items.length})} className="stagger -mx-2 space-y-0.5">
                {items.map((day, index) => (
                    <DailyRow
                        key={day.time}
                        day={day}
                        index={index}
                        bounds={bounds}
                        currentTemp={index === 0 ? currentTemp : null}
                        timezone={timezone}
                        locale={locale}
                        isOpen={openIndex === index}
                        onToggle={toggle}
                        style={staggerIndex(index)}
                    />
                ))}
            </ol>
        </Card>
    );
};
