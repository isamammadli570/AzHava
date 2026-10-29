import {useEffect, useRef, useState} from "react";
import {roundTemp} from "@/helpers/format";
import {useReducedMotion} from "@/hooks/useReducedMotion";
import {cn} from "@/lib/utils";

type AnimatedNumberProps = {value: number; decimals?: number; durationMs?: number; className?: string};

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const format = (value: number, decimals: number): string => (decimals > 0 ? value.toFixed(decimals) : String(roundTemp(value)));

/**
 * Counts from the previous value to the new one (from zero on first paint), so numbers roll in instead of jumping.
 * Writes straight to the DOM node each frame: no React re-render per frame, which keeps a dozen counters cheap.
 */
export const AnimatedNumber = ({value, decimals = 0, durationMs = 1100, className}: AnimatedNumberProps) => {
    const isReduced = useReducedMotion();
    const nodeRef = useRef<HTMLSpanElement>(null);
    // What is on screen right now, so a new value mid-animation continues from there instead of jumping.
    const shownRef = useRef(0);
    const [initial] = useState(() => format(isReduced ? value : 0, decimals));

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const from = shownRef.current;
        const show = (next: number) => {
            shownRef.current = next;
            node.textContent = format(next, decimals);
        };
        if (isReduced || from === value) {
            show(value);
            return;
        }

        let frame = 0;
        const start = performance.now();
        const step = (time: number) => {
            const progress = Math.min(1, (time - start) / durationMs);
            show(from + (value - from) * easeOutCubic(progress));
            if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [value, decimals, durationMs, isReduced]);

    return <span ref={nodeRef} className={cn("tabular", className)}>{initial}</span>;
};
