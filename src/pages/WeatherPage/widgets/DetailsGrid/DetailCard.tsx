import type {CSSProperties, ReactNode} from "react";
import {Card, CardHeader} from "@/components/ui/card";
import {AnimatedNumber} from "@/widgets/AnimatedNumber";
import {InfoPopover} from "@/widgets/InfoPopover";
import {cn} from "@/lib/utils";

type DetailCardProps = {
    icon: ReactNode;
    title: string;
    /** Numbers roll to their new value; strings are shown as they are. */
    value?: number | string;
    decimals?: number;
    unit?: string;
    caption?: ReactNode;
    /** Plain-language explanation behind the "?" button. */
    info?: string;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

/** Shell shared by every detail tile: label, big value, a visual, and a one-line explanation. */
export const DetailCard = ({icon, title, value, decimals = 0, unit, caption, info, children, className, style}: DetailCardProps) => (
    <Card style={style} className={cn("reveal spotlight flex min-h-44 flex-col transition-[translate] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-1", className)}>
        {/* The "?" sits in the corner, outside the header row, so narrow phone cards keep the title on one line. */}
        {info && (
            <div className="absolute top-2.5 right-2.5 z-10 sm:top-3.5 sm:right-3.5">
                <InfoPopover title={title} text={info}/>
            </div>
        )}
        <CardHeader icon={icon} title={title} className={cn("mb-2 min-h-7", info && "pr-6")}/>
        {value !== undefined && (
            <p className="font-display text-3xl font-semibold tracking-tight tabular sm:text-4xl">
                {typeof value === "number" ? <AnimatedNumber value={value} decimals={decimals}/> : value}
                {unit === "°" ? (
                    <span className="font-light text-muted-foreground">°</span>
                ) : (
                    unit && <span className="ml-1 text-sm font-medium text-muted-foreground sm:text-base">{unit}</span>
                )}
            </p>
        )}
        {children && <div className="mt-3 flex flex-1 flex-col justify-center">{children}</div>}
        {caption && <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">{caption}</p>}
    </Card>
);

type MeterProps = {value: number; className?: string; barClassName?: string; style?: CSSProperties};

/** Horizontal 0–100 fill bar that grows in from the left. */
export const Meter = ({value, className, barClassName, style}: MeterProps) => (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)}>
        <div className={cn("h-full origin-left animate-bar-grow rounded-full", barClassName)} style={{width: `${Math.min(100, Math.max(0, value))}%`, ...style}}/>
    </div>
);

type ScaleMarkerProps = {position: number; gradient: string; className?: string};

/** A coloured scale with a dot showing where the value sits (UV, AQI). */
export const ScaleMarker = ({position, gradient, className}: ScaleMarkerProps) => (
    <div className={cn("relative h-2 rounded-full", className)} style={{background: gradient}}>
        <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/70 bg-white shadow-[0_0_0_3px_rgb(255_255_255/0.25)] transition-[left] duration-(--duration-slow) ease-(--ease-out)"
            style={{left: `${Math.min(100, Math.max(0, position))}%`}}
        />
    </div>
);
