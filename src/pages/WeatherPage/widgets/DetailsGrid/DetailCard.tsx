import type {CSSProperties, ReactNode} from "react";
import {ChevronRight} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useOpenSheet, type SheetKind, type TemperatureMode} from "@/hooks/useDetailSheet";
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
    /** Plain-language explanation behind the "?" button (cards without a sheet). */
    info?: string;
    /** The detail sheet the whole card opens. */
    sheet?: SheetKind;
    sheetMode?: TemperatureMode;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
};

/**
 * Shell shared by every detail tile: label, big value, a visual, and a one-line explanation. With a `sheet`, the
 * whole card is one button that opens it (a cover over the card, so the visuals inside stay plain markup).
 */
export const DetailCard = ({icon, title, value, decimals = 0, unit, caption, info, sheet, sheetMode, children, className, style}: DetailCardProps) => {
    const {t} = useTranslation("weather");
    const openSheet = useOpenSheet();

    return (
        <Card style={style} className={cn("reveal spotlight relative flex min-h-44 flex-col transition-[translate] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-1", sheet && "group cursor-pointer", className)}>
            {sheet ? (
                <>
                    <button
                        type="button"
                        onClick={() => openSheet(sheet, {mode: sheetMode})}
                        aria-label={t("sheet.open", {name: title})}
                        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    />
                    <ChevronRight aria-hidden className="absolute top-4 right-3.5 size-4 text-subtle-foreground transition-[translate,color] duration-(--duration-base) group-hover:translate-x-0.5 group-hover:text-foreground sm:top-5 sm:right-4"/>
                </>
            ) : (
                info && (
                    // The "?" sits in the corner, outside the header row, so narrow phone cards keep the title on one line.
                    <div className="absolute top-2.5 right-2.5 z-10 sm:top-3.5 sm:right-3.5">
                        <InfoPopover title={title} text={info}/>
                    </div>
                )
            )}
            <CardHeader icon={icon} title={title} className={cn("mb-2 min-h-7", (info || sheet) && "pr-6")}/>
            {value !== undefined && (
                <p className="text-[2.125rem] leading-none font-extralight tracking-tight tabular sm:text-[2.5rem]">
                    {typeof value === "number" ? <AnimatedNumber value={value} decimals={decimals}/> : value}
                    {unit === "°" ? (
                        <span>°</span>
                    ) : (
                        unit && <span className="ml-1.5 text-sm font-light tracking-[0.18em] text-muted-foreground uppercase">{unit}</span>
                    )}
                </p>
            )}
            {children && <div className="mt-3 flex flex-1 flex-col justify-center">{children}</div>}
            {caption && <p className="mt-3 text-[12.5px] leading-snug font-light text-muted-foreground">{caption}</p>}
        </Card>
    );
};

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
    <div className={cn("relative h-1 rounded-full", className)}>
        <span className="absolute inset-0 rounded-full opacity-70" style={{background: gradient}}/>
        <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[rgb(12_15_20)] bg-white shadow-[0_0_0_3px_rgb(255_255_255/0.18),0_0_12px_rgb(255_255_255/0.4)] transition-[left] duration-(--duration-slow) ease-(--ease-out)"
            style={{left: `${Math.min(100, Math.max(0, position))}%`}}
        />
    </div>
);
