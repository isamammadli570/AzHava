import {useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";
import {formatFullDate, formatWeekday, localDateKey} from "@/helpers/dates";
import type {DailyPoint} from "@/helpers/forecast";
import {cn} from "@/lib/utils";

type DayPickerProps = {days: DailyPoint[]; selected: number; onSelect: (index: number) => void; timezone: string; locale: string};

/**
 * The days a sheet can show, as weekday + date circles in a row that scrolls sideways when they do not all fit, with
 * the chosen day's full date below. The chosen day is kept in view.
 */
export const DayPicker = ({days, selected, onSelect, timezone, locale}: DayPickerProps) => {
    const {t} = useTranslation("weather");
    const listRef = useRef<HTMLDivElement>(null);
    const chosen = days[selected];

    useEffect(() => {
        listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({block: "nearest", inline: "center", behavior: "smooth"});
    }, [selected]);

    return (
        <div className="mb-5">
            <div ref={listRef} role="tablist" aria-label={t("sheet.chooseDay")} className="mask-fade-x scrollbar-none -mx-4 flex snap-x scroll-px-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
                {days.map((day, index) => {
                    const isSelected = index === selected;
                    return (
                        <button
                            key={day.time}
                            type="button"
                            role="tab"
                            data-index={index}
                            aria-selected={isSelected}
                            aria-label={formatFullDate(day.time, timezone, locale)}
                            onClick={() => onSelect(index)}
                            className="group flex min-w-12 flex-1 shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span className="text-[9.5px] font-light tracking-[0.08em] whitespace-nowrap text-subtle-foreground uppercase">{formatWeekday(day.time, timezone, locale, "short")}</span>
                            <span
                                className={cn(
                                    "grid size-9 place-items-center rounded-full text-[13px] font-light tabular transition-[background-color,color,scale] duration-(--duration-base) ease-(--ease-out)",
                                    isSelected ? "scale-105 bg-foreground text-background" : "group-hover:bg-white/10",
                                    index === 0 && !isSelected && "text-brand",
                                )}
                            >
                                {Number(localDateKey(day.time, timezone).slice(8))}
                            </span>
                        </button>
                    );
                })}
            </div>
            {chosen && <p className="mt-3 text-center text-[12px] font-light tracking-[0.14em] text-muted-foreground uppercase">{formatFullDate(chosen.time, timezone, locale)}</p>}
        </div>
    );
};
