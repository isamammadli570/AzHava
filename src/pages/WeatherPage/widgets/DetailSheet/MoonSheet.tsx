import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock, formatDayMonth, formatFullDate, formatMonthYear, formatWeekday, localDateKey} from "@/helpers/dates";
import {formatNumber} from "@/helpers/format";
import {findNewAndFull, moonDistanceKm, moonInfo, moonPhaseAt} from "@/helpers/moon";
import {cn} from "@/lib/utils";
import {MoonDisc} from "@/widgets/MoonDisc";
import {SheetSection, SheetText, StatRows} from "@/pages/WeatherPage/widgets/DetailSheet/parts";

const DAY = 86_400;
/** Days either side of today on the timeline. */
const RANGE = 15;
const TICK = 44;

type MoonSheetProps = {now: number; latitude: number; longitude: number; utcOffset: number; timezone: string; locale: string};

/** Monday-first weekday headers, from a known Monday (1 Jan 2024). */
const weekdayHeaders = (locale: string) => Array.from({length: 7}, (_, index) => formatWeekday(Date.UTC(2024, 0, 1 + index, 12) / 1000, "UTC", locale, "short"));

/**
 * The moon in depth: a large disc for the chosen day, a timeline to scroll a fortnight either way, rise and set,
 * illumination, distance, and a month calendar of phases with its new and full moon days.
 */
export const MoonSheet = ({now, latitude, longitude, utcOffset, timezone, locale}: MoonSheetProps) => {
    const {t} = useTranslation("weather");
    const [offset, setOffset] = useState(0);
    const [shownMonth, setShownMonth] = useState<{year: number; month: number} | null>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const frame = useRef(0);

    const selected = now + offset * DAY;
    const info = useMemo(() => moonInfo(selected, latitude, longitude, utcOffset), [selected, latitude, longitude, utcOffset]);
    const distance = useMemo(() => moonDistanceKm(selected, latitude, longitude), [selected, latitude, longitude]);
    const clock = (value: number | null) => (value === null ? t("moon.none") : formatClock(value, timezone, locale));

    // Start the timeline on today.
    useLayoutEffect(() => {
        if (scrollerRef.current) scrollerRef.current.scrollLeft = RANGE * TICK;
    }, []);
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    const onScroll = () => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            const scroller = scrollerRef.current;
            if (!scroller) return;
            setOffset(Math.round(scroller.scrollLeft / TICK) - RANGE);
            setShownMonth(null);
        });
    };
    const selectOffset = (next: number) => {
        setOffset(next);
        setShownMonth(null);
        if (Math.abs(next) <= RANGE) scrollerRef.current?.scrollTo({left: (next + RANGE) * TICK, behavior: "smooth"});
    };

    // The calendar shows the chosen day's month unless the visitor has paged to another one.
    const [selYear, selMonth] = localDateKey(selected, timezone).split("-").map(Number);
    const month = shownMonth ?? {year: selYear, month: selMonth - 1};
    const todayKey = localDateKey(now, timezone);
    const selectedKey = localDateKey(selected, timezone);
    const days = useMemo(() => {
        const count = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
        return Array.from({length: count}, (_, index) => {
            const noon = Date.UTC(month.year, month.month, index + 1, 12) / 1000 - utcOffset;
            return {day: index + 1, noon, phase: moonPhaseAt(noon), key: `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`};
        });
    }, [month.year, month.month, utcOffset]);
    const leadingBlanks = (new Date(Date.UTC(month.year, month.month, 1)).getUTCDay() + 6) % 7;
    const {newMoon, fullMoon} = findNewAndFull(days.map((day) => day.phase));
    const pageMonth = (step: number) => setShownMonth({year: month.year + Math.floor((month.month + step) / 12), month: (((month.month + step) % 12) + 12) % 12});
    const [todayYear, todayMonth, todayDay] = todayKey.split("-").map(Number);
    const todayNoon = Date.UTC(todayYear, todayMonth - 1, todayDay, 12) / 1000 - utcOffset;

    return (
        <>
            <div className="flex flex-col items-center pt-2 pb-4 text-center">
                <MoonDisc key={info.name} phase={info.phase} className="size-44 animate-[fade-in_500ms_var(--ease-out)] sm:size-52"/>
                <p className="mt-4 text-[1.375rem] font-extralight tracking-[0.04em]">{t(`moon.phases.${info.name}`)}</p>
                <p className="mt-1 text-[12px] font-light tracking-[0.14em] text-muted-foreground uppercase">{formatFullDate(selected, timezone, locale)}</p>
            </div>

            {/* A fortnight either way: scroll (or swipe) the ticks under the marker to move through the days. */}
            <div className="relative mb-6">
                <span aria-hidden className="absolute top-0 left-1/2 z-10 h-7 w-0.5 -translate-x-1/2 rounded-full bg-foreground"/>
                <div
                    ref={scrollerRef}
                    onScroll={onScroll}
                    role="slider"
                    tabIndex={0}
                    aria-label={t("sheet.moonTimeline")}
                    aria-valuemin={-RANGE}
                    aria-valuemax={RANGE}
                    aria-valuenow={offset}
                    aria-valuetext={formatFullDate(selected, timezone, locale)}
                    onKeyDown={(event) => {
                        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                        event.preventDefault();
                        selectOffset(Math.max(-RANGE, Math.min(RANGE, offset + (event.key === "ArrowRight" ? 1 : -1))));
                    }}
                    className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto px-[calc(50%-22px)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)"}}
                >
                    {Array.from({length: RANGE * 2 + 1}, (_, index) => {
                        const dayOffset = index - RANGE;
                        const time = now + dayOffset * DAY;
                        return (
                            <button
                                key={dayOffset}
                                type="button"
                                tabIndex={-1}
                                onClick={() => selectOffset(dayOffset)}
                                className="flex shrink-0 snap-center flex-col items-center gap-1.5"
                                style={{width: TICK}}
                            >
                                <span className={cn("block w-px rounded-full bg-white/35", dayOffset === offset ? "h-7 opacity-0" : "h-5")}/>
                                <span className={cn("text-[9.5px] font-light tracking-[0.06em] uppercase", dayOffset === 0 ? "text-brand" : "text-subtle-foreground")}>
                                    {dayOffset === 0 ? t("sheet.todayShort") : formatWeekday(time, timezone, locale, "short")}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <SheetSection>
                <StatRows
                    rows={[
                        {label: t("moon.illumination"), value: `${Math.round(info.illumination * 100)}%`},
                        {label: t("moon.rise"), value: clock(info.rise)},
                        {label: t("moon.set"), value: clock(info.set)},
                        {label: t("sheet.nextFullMoon"), value: info.daysToFull === 0 ? t("moon.today") : t("moon.inDays", {count: info.daysToFull})},
                        {label: t("sheet.distance"), value: `${formatNumber(Math.round(distance))} ${t("details.km")}`},
                    ]}
                />
            </SheetSection>

            <SheetSection title={t("sheet.calendar")}>
                <div className="mb-3 flex items-center justify-between">
                    <button type="button" onClick={() => pageMonth(-1)} aria-label={t("sheet.previousMonth")} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground">
                        <ChevronLeft className="size-4"/>
                    </button>
                    <p className="text-[13px] font-light tracking-[0.12em] uppercase">{formatMonthYear(month.year, month.month, locale)}</p>
                    <button type="button" onClick={() => pageMonth(1)} aria-label={t("sheet.nextMonth")} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground">
                        <ChevronRight className="size-4"/>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center">
                    {weekdayHeaders(locale).map((name) => (
                        <span key={name} className="pb-1 text-[9.5px] font-light tracking-[0.06em] text-subtle-foreground uppercase">{name}</span>
                    ))}
                    {Array.from({length: leadingBlanks}, (_, index) => <span key={`blank-${index}`}/>)}
                    {days.map((day) => (
                        <button
                            key={day.key}
                            type="button"
                            onClick={() => selectOffset(Math.round((day.noon - todayNoon) / DAY))}
                            aria-label={formatFullDate(day.noon, timezone, locale)}
                            aria-pressed={day.key === selectedKey}
                            className={cn("flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors", day.key === selectedKey ? "bg-white/12" : "hover:bg-white/6")}
                        >
                            <MoonDisc phase={day.phase} className="size-6 drop-shadow-none"/>
                            <span className={cn("text-[11px] font-light tabular", day.key === todayKey ? "text-brand" : "text-muted-foreground")}>{day.day}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    <StatRows
                        rows={[
                            {label: t("moon.phases.new"), value: newMoon === null ? t("moon.none") : formatDayMonth(days[newMoon].noon, timezone, locale)},
                            {label: t("moon.phases.full"), value: fullMoon === null ? t("moon.none") : formatDayMonth(days[fullMoon].noon, timezone, locale)},
                        ]}
                    />
                </div>
            </SheetSection>

            <SheetSection title={t("sheet.aboutIllumination")}>
                <SheetText>{t("sheet.about.illumination")}</SheetText>
            </SheetSection>
        </>
    );
};
