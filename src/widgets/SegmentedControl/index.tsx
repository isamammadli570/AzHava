import type {CSSProperties} from "react";
import {cn} from "@/lib/utils";

type SegmentedOption<TValue> = {value: TValue; label: string};

type SegmentedControlProps<TValue extends string | number> = {
    options: readonly SegmentedOption<TValue>[];
    value: TValue;
    onChange: (value: TValue) => void;
    label: string;
    className?: string;
};

/** Pill switch with a sliding thumb, for small exclusive choices (24/48 hours, 7/16 days). */
export const SegmentedControl = <TValue extends string | number>({options, value, onChange, label, className}: SegmentedControlProps<TValue>) => {
    const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));

    return (
        <div role="group" aria-label={label} className={cn("relative inline-grid auto-cols-fr grid-flow-col rounded-full bg-white/8 p-0.5 ring-1 ring-glass-border", className)}>
            <span
                aria-hidden
                className="absolute inset-y-0.5 left-0.5 rounded-full bg-white/90 shadow-sm transition-transform duration-(--duration-base) ease-(--ease-out)"
                style={{width: `calc((100% - 0.25rem) / ${options.length})`, transform: `translateX(${activeIndex * 100}%)`} as CSSProperties}
            />
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "relative z-10 h-7 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors duration-(--duration-base) focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            isActive ? "text-slate-900" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
