import {memo, useCallback, useMemo, useState} from "react";
import {CalendarDays} from "lucide-react";
import {useTranslation} from "react-i18next";
import {DAILY_RANGES, type DailyRange} from "@/constants/other";
import {temperatureBounds, type DailyPoint} from "@/helpers/forecast";
import {useOpenSheet} from "@/hooks/useDetailSheet";
import {useLanguage} from "@/hooks/useLanguage";
import {Card, CardHeader} from "@/components/ui/card";
import {SegmentedControl} from "@/widgets/SegmentedControl";
import {DailyRow} from "@/pages/WeatherPage/widgets/DailyForecast/DailyRow";
import {staggerIndex} from "@/lib/utils";

type DailyForecastProps = {days: DailyPoint[]; timezone: string; currentTemp: number; placeId: string};

/** 7 or 16 days, every range bar on one shared scale so warm and cold days compare honestly; a day opens its sheet. */
export const DailyForecast = memo(({days, timezone, currentTemp, placeId}: DailyForecastProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const [range, setRange] = useState<DailyRange>(7);
    const openSheet = useOpenSheet();
    const items = useMemo(() => days.slice(0, range), [days, range]);
    const bounds = useMemo(() => temperatureBounds(items), [items]);
    // The model horizon sometimes ends a day early (last day all null), so the label shows what is really there.
    const rangeOptions = DAILY_RANGES.map((value) => ({value, label: t("daily.range", {count: Math.min(value, days.length)})}));

    const open = useCallback((index: number) => openSheet("conditions", {day: index}), [openSheet]);

    return (
        <Card aria-labelledby="daily-title" className="[grid-area:daily]">
            <CardHeader
                id="daily-title"
                hasDivider
                icon={<CalendarDays/>}
                title={t("daily.title")}
                actions={<SegmentedControl options={rangeOptions} value={range} onChange={setRange} label={t("daily.title")}/>}
            />
            <ol key={`${placeId}-${range}`} aria-label={t("daily.listLabel", {count: items.length})} className="stagger">
                {items.map((day, index) => (
                    <DailyRow
                        key={day.time}
                        day={day}
                        index={index}
                        bounds={bounds}
                        currentTemp={index === 0 ? currentTemp : null}
                        timezone={timezone}
                        locale={locale}
                        onOpen={open}
                        style={staggerIndex(index)}
                    />
                ))}
            </ol>
        </Card>
    );
});
