import {useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {ChevronLeft, ChevronRight, CircleArrowLeft, CircleArrowRight} from "lucide-react";
import {useTranslation} from "react-i18next";
import {formatClock, formatDayMonth, formatFullDate, formatMonthYear, formatWeekday, localDateKey, localHour} from "@/helpers/dates";
import {findNewAndFull, moonDistanceKm, moonInfo, moonPhaseAt} from "@/helpers/moon";
import {cn} from "@/lib/utils";
import {MoonDisc} from "@/widgets/MoonDisc";

const HOUR = 3600;
const DAY = 86_400;
/** Hours either side of now on the timeline (a fortnight). */
const RANGE_HOURS = 15 * 24;
/** Timeline scale, as on iOS: pixels per hour, a thin tick every 2 hours and a bright one at each midnight. */
const PX_PER_HOUR = 2.9;
const TICK_HOURS = 2;

type MoonSheetProps = {now: number; latitude: number; longitude: number; utcOffset: number; timezone: string; locale: string};

/** Monday-first one-letter weekday headers, from a known Monday (1 Jan 2024). */
const weekdayLetters = (locale: string) =>
    Array.from({length: 7}, (_, index) => formatWeekday(Date.UTC(2024, 0, 1 + index, 12) / 1000, "UTC", locale).charAt(0).toUpperCase());

/** An iOS-style grouped list: rows on one dark panel, hairlines between them. */
const GroupedRows = ({rows}: {rows: {label: ReactNode; value: ReactNode}[]}) => (
    <dl className="divide-y divide-white/10 rounded-xl bg-[#1c1c1e] px-4">
        {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between gap-3 py-3 text-[15px]">
                <dt className="min-w-0 truncate">{row.label}</dt>
                <dd className="shrink-0 text-white/55 tabular">{row.value}</dd>
            </div>
        ))}
    </dl>
);

const Heading = ({children}: {children: ReactNode}) => <h3 className="mt-7 mb-2.5 text-[19px] font-semibold">{children}</h3>;

/**
 * The moon, laid out like iOS Weather: a large photographic moon on black, its phase and the moment shown, a ruler to
 * scrub hour by hour a fortnight either way, the readings in a grouped list, a month calendar of phases with its new
 * and full moon, and what illumination means. Scrolled down, the moon shrinks into a header with three readings.
 */
export const MoonSheet = ({now, latitude, longitude, utcOffset, timezone, locale}: MoonSheetProps) => {
    const {t} = useTranslation("weather");
    const [offset, setOffset] = useState(0);
    const [shownMonth, setShownMonth] = useState<{year: number; month: number} | null>(null);
    const [isCompact, setIsCompact] = useState(false);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const frame = useRef(0);

    // The ruler counts whole hours from the current hour; at its centre it shows the exact current time.
    const baseHour = Math.floor(now / HOUR) * HOUR;
    const selected = offset === 0 ? now : baseHour + offset * HOUR;
    const info = useMemo(() => moonInfo(selected, latitude, longitude, utcOffset), [selected, latitude, longitude, utcOffset]);
    const distance = useMemo(() => moonDistanceKm(selected, latitude, longitude), [selected, latitude, longitude]);
    const clock = (value: number) => formatClock(value, timezone, locale);
    // iOS writes "4 noyabr 02:00" away from today, with the weekday only for today.
    const formatDayMonthLong = (value: number) => formatFullDate(value, timezone, locale).split(", ").pop() ?? "";
    const number = new Intl.NumberFormat(locale);

    useLayoutEffect(() => {
        if (scrollerRef.current) scrollerRef.current.scrollLeft = RANGE_HOURS * PX_PER_HOUR;
    }, []);
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    // The compact header takes over once the big moon and its ruler have scrolled away.
    useEffect(() => {
        const sentinel = sentinelRef.current;
        const root = sentinel?.closest<HTMLElement>(".overflow-y-auto");
        if (!sentinel || !root) return;
        const observer = new IntersectionObserver(([entry]) => setIsCompact(!entry.isIntersecting), {root, rootMargin: "-120px 0px 0px 0px"});
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    const onScroll = () => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            const scroller = scrollerRef.current;
            if (!scroller) return;
            setOffset(Math.round(scroller.scrollLeft / PX_PER_HOUR) - RANGE_HOURS);
            setShownMonth(null);
        });
    };
    const goTo = (hours: number, smooth = true) => {
        setOffset(hours);
        setShownMonth(null);
        const clamped = Math.max(-RANGE_HOURS, Math.min(RANGE_HOURS, hours));
        scrollerRef.current?.scrollTo({left: (clamped + RANGE_HOURS) * PX_PER_HOUR, behavior: smooth ? "smooth" : "auto"});
    };

    // Days on the ruler: one block per local day, from midnight to midnight, labelled at noon.
    const rulerStart = baseHour - RANGE_HOURS * HOUR;
    const firstMidnight = rulerStart - ((localHour(rulerStart, timezone) * HOUR) % DAY);
    const rulerDays = Array.from({length: 33}, (_, index) => firstMidnight + index * DAY).filter((midnight) => midnight + DAY > rulerStart && midnight < rulerStart + RANGE_HOURS * 2 * HOUR + HOUR);
    const todayKey = localDateKey(now, timezone);

    // The calendar shows the chosen moment's month unless the visitor pages to another one.
    const selectedKey = localDateKey(selected, timezone);
    const [selYear, selMonth] = selectedKey.split("-").map(Number);
    const month = shownMonth ?? {year: selYear, month: selMonth - 1};
    const days = useMemo(() => {
        const count = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
        return Array.from({length: count}, (_, index) => {
            const noon = Date.UTC(month.year, month.month, index + 1, 12) / 1000 - utcOffset;
            return {day: index + 1, noon, phase: moonPhaseAt(noon), key: localDateKey(noon, timezone)};
        });
    }, [month.year, month.month, utcOffset, timezone]);
    const leadingBlanks = (new Date(Date.UTC(month.year, month.month, 1)).getUTCDay() + 6) % 7;
    const {newMoon, fullMoon} = findNewAndFull(days.map((day) => day.phase));
    const pageMonth = (step: number) => setShownMonth({year: month.year + Math.floor((month.month + step) / 12), month: (((month.month + step) % 12) + 12) % 12});
    const dayLabel = (time: number) => `${formatDayMonth(time, timezone, locale)} ${formatWeekday(time, timezone, locale, "short")}`;

    // Rise and set in the order they happen that day; a missing one goes last.
    const events = [
        {label: t("moon.set"), time: info.set},
        {label: t("moon.rise"), time: info.rise},
    ].sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));
    const illumination = `${Math.round(info.illumination * 100)}%`;

    return (
        <div className="text-white">
            {/* The compact header: a smaller moon, the phase and three readings, pinned while the rest scrolls. */}
            <div className="pointer-events-none sticky top-0 z-20 -mx-4 h-0 sm:-mx-6">
                <div
                    aria-hidden={!isCompact}
                    className={cn(
                        "flex flex-col items-center bg-black px-4 pt-1 pb-4 transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out)",
                        isCompact ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
                    )}
                >
                    <MoonDisc time={selected} className="size-28"/>
                    <p className="mt-2 text-[17px] font-semibold">{t(`moon.phases.${info.name}`)}</p>
                    <dl className="mt-2 grid grid-cols-3 divide-x divide-white/15 text-center">
                        {[
                            {label: t("moon.illumination"), value: illumination},
                            ...events.map((event) => ({label: event.label, value: event.time === null ? t("moon.none") : clock(event.time)})),
                        ].map((item) => (
                            <div key={item.label} className="px-3">
                                <dt className="text-[9.5px] font-semibold tracking-[0.04em] text-white/55 uppercase">{item.label}</dt>
                                <dd className="text-[15px] tabular">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            <div className="flex flex-col items-center pt-1 text-center">
                <MoonDisc time={selected} className="size-60 animate-[fade-in_500ms_var(--ease-out)] sm:size-64"/>
                <p className="mt-5 text-[20px] font-semibold">{t(`moon.phases.${info.name}`)}</p>
                <div className="relative mt-0.5 flex w-full items-center justify-center">
                    <p className="text-[15px] text-white/55">
                        <span className="inline-block first-letter:uppercase">{offset === 0 ? formatFullDate(selected, timezone, locale) : formatDayMonthLong(selected)}</span> {clock(offset === 0 ? baseHour : selected)}
                    </p>
                    {offset !== 0 && (
                        <button
                            type="button"
                            onClick={() => goTo(0)}
                            aria-label={t("sheet.backToNow")}
                            className="absolute right-0 grid size-8 place-items-center rounded-full text-[#0a84ff] transition-opacity hover:opacity-80"
                        >
                            {offset > 0 ? <CircleArrowLeft className="size-6" strokeWidth={1.75}/> : <CircleArrowRight className="size-6" strokeWidth={1.75}/>}
                        </button>
                    )}
                </div>
            </div>

            {/* The ruler: scroll it under the marker to move hour by hour; arrow keys move an hour, with Shift a day. */}
            <div className="relative -mx-4 mt-3 sm:-mx-6">
                {/* The marker: blue while it rests on "now", white once moved away (a blue dot then shows where now is). */}
                <span aria-hidden className={cn("absolute top-0 left-1/2 z-10 -translate-x-1/2 border-x-[6px] border-t-[9px] border-x-transparent transition-colors duration-(--duration-fast)", offset === 0 ? "border-t-[#64d2ff]" : "border-t-white")}/>
                <div
                    ref={scrollerRef}
                    onScroll={onScroll}
                    role="slider"
                    tabIndex={0}
                    aria-label={t("sheet.moonTimeline")}
                    aria-valuemin={-RANGE_HOURS}
                    aria-valuemax={RANGE_HOURS}
                    aria-valuenow={offset}
                    aria-valuetext={`${formatFullDate(selected, timezone, locale)} ${clock(selected)}`}
                    onKeyDown={(event) => {
                        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                        event.preventDefault();
                        const step = (event.shiftKey ? 24 : 1) * (event.key === "ArrowRight" ? 1 : -1);
                        goTo(Math.max(-RANGE_HOURS, Math.min(RANGE_HOURS, offset + step)), false);
                    }}
                    className="scrollbar-none overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)"}}
                >
                    {/* Half the strip's width of padding on each side lets the first and last hour reach the marker. */}
                    <div className="w-max px-[50%]">
                        <div className="relative h-14 overflow-hidden" style={{width: RANGE_HOURS * 2 * PX_PER_HOUR}}>
                            {/* Where "now" is, once the marker has moved away from it. */}
                        {offset !== 0 && <span className="absolute top-0 size-1.5 -translate-x-1/2 rounded-full bg-[#64d2ff]" style={{left: (RANGE_HOURS + (now - baseHour) / HOUR) * PX_PER_HOUR}}/>}
                        {rulerDays.map((midnight) => {
                                const left = ((midnight - rulerStart) / HOUR) * PX_PER_HOUR;
                                const isToday = localDateKey(midnight + DAY / 2, timezone) === todayKey;
                                return (
                                    <div key={midnight} className="absolute top-3 h-10" style={{left, width: 24 * PX_PER_HOUR}}>
                                        <span
                                            className="absolute top-0 h-5 w-full"
                                            style={{backgroundImage: `repeating-linear-gradient(90deg, rgb(255 255 255 / 0.32) 0 1px, transparent 1px ${TICK_HOURS * PX_PER_HOUR}px)`}}
                                        />
                                        <span className="absolute top-0 left-0 h-5 w-[2px] -translate-x-1/2 rounded-full bg-white"/>
                                        <span className={cn("absolute top-[1.625rem] left-1/2 -translate-x-1/2 text-[11px] font-medium whitespace-nowrap uppercase", isToday ? "text-white" : "text-white/55")}>
                                            {isToday ? t("sheet.todayShort") : formatWeekday(midnight + DAY / 2, timezone, locale, "short")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div ref={sentinelRef}/>

            <div className="mt-3">
                <GroupedRows
                    rows={[
                        {label: t("moon.illumination"), value: illumination},
                        ...events.map((event) => ({label: event.label, value: event.time === null ? t("moon.none") : clock(event.time)})),
                        {label: t("sheet.nextFullMoon"), value: info.daysToFull === 0 ? t("moon.today") : t("moon.inDays", {count: info.daysToFull})},
                        {label: t("sheet.distance"), value: `${number.format(Math.round(distance))} ${t("details.km")}`},
                    ]}
                />
            </div>

            <Heading>{t("sheet.calendar")}</Heading>
            <div className="rounded-xl bg-[#1c1c1e] px-3 pt-3 pb-1">
                <div className="mb-3 flex items-center justify-between">
                    <button type="button" onClick={() => pageMonth(-1)} aria-label={t("sheet.previousMonth")} className="grid size-8 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white">
                        <ChevronLeft className="size-5"/>
                    </button>
                    <p className="text-[16px] font-semibold">{formatMonthYear(month.year, month.month, locale)}</p>
                    <button type="button" onClick={() => pageMonth(1)} aria-label={t("sheet.nextMonth")} className="grid size-8 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white">
                        <ChevronRight className="size-5"/>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-y-1.5 text-center">
                    {weekdayLetters(locale).map((letter, index) => (
                        <span key={index} className={cn("pb-1 text-[11px] font-semibold", index >= 5 ? "text-white/35" : "text-white/55")}>{letter}</span>
                    ))}
                    {Array.from({length: leadingBlanks}, (_, index) => <span key={`blank-${index}`}/>)}
                    {days.map((day, index) => {
                        const isWeekend = (leadingBlanks + index) % 7 >= 5;
                        const isSelected = day.key === selectedKey;
                        return (
                            <button
                                key={day.key}
                                type="button"
                                onClick={() => goTo(Math.round((day.noon - baseHour) / HOUR))}
                                aria-label={formatFullDate(day.noon, timezone, locale)}
                                aria-pressed={isSelected}
                                className={cn("mx-auto flex w-10 flex-col items-center gap-1 rounded-lg py-1.5 transition-colors", isSelected ? "bg-white/15" : "hover:bg-white/8")}
                            >
                                <span className={cn("text-[11px] tabular", day.key === todayKey ? "font-semibold text-[#0a84ff]" : isWeekend ? "text-white/40" : "text-white/70")}>{day.day}</span>
                                <MoonDisc time={day.noon} earthshine={0.04} className="size-5"/>
                            </button>
                        );
                    })}
                </div>
                <dl className="mt-3 divide-y divide-white/10 border-t border-white/10">
                    {[
                        {label: t("moon.phases.new"), value: newMoon === null ? t("moon.none") : dayLabel(days[newMoon].noon)},
                        {label: t("moon.phases.full"), value: fullMoon === null ? t("moon.none") : dayLabel(days[fullMoon].noon)},
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3 px-1 py-3 text-[15px]">
                            <dt>{row.label}</dt>
                            <dd className="text-white/55">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <Heading>{t("sheet.aboutIllumination")}</Heading>
            <p className="rounded-xl bg-[#1c1c1e] p-4 text-[15px] leading-relaxed text-white/90">{t("sheet.about.illumination")}</p>
        </div>
    );
};
