import {useMemo, type CSSProperties} from "react";
import {Moon} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock} from "@/helpers/dates";
import {moonInfo} from "@/helpers/moon";
import {useLanguage} from "@/hooks/useLanguage";
import {useNow} from "@/hooks/useNow";
import {MoonDisc} from "@/widgets/MoonDisc";
import {DetailCard} from "@/pages/WeatherPage/widgets/DetailsGrid/DetailCard";
import {cn} from "@/lib/utils";

type MoonCardProps = {latitude: number; longitude: number; utcOffset: number; timezone: string; className?: string; style?: CSSProperties};

/** Tonight's moon: phase (as the card title), illumination, moonrise and moonset, and days to the next full moon. */
export const MoonCard = ({latitude, longitude, utcOffset, timezone, className, style}: MoonCardProps) => {
    const {t} = useTranslation("weather");
    const {locale} = useLanguage();
    const now = useNow(60_000);
    // Moon data moves slowly; recompute once a minute at most.
    const info = useMemo(() => moonInfo(now, latitude, longitude, utcOffset), [now, latitude, longitude, utcOffset]);
    const time = (value: number | null) => (value === null ? t("moon.none") : formatClock(value, timezone, locale));

    const rows = [
        {label: t("moon.illumination"), value: `${Math.round(info.illumination * 100)}%`},
        {label: t("moon.rise"), value: time(info.rise)},
        {label: t("moon.set"), value: time(info.set)},
        {label: t("moon.nextFull"), value: info.daysToFull === 0 ? t("moon.today") : t("moon.inDays", {count: info.daysToFull})},
    ];

    return (
        <DetailCard style={style} className={cn("min-h-0", className)} icon={<Moon/>} title={t(`moon.phases.${info.name}`)} sheet="moon">
            <div className="flex items-center gap-4">
                <dl className="min-w-0 flex-1">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 text-[14px] font-light last:border-b-0">
                            <dt className="truncate text-muted-foreground">{row.label}</dt>
                            <dd className="shrink-0 tracking-[0.06em] tabular">{row.value}</dd>
                        </div>
                    ))}
                </dl>
                <MoonDisc phase={info.phase} className="size-28 sm:size-36"/>
            </div>
        </DetailCard>
    );
};
