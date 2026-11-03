import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

type SheetSectionProps = {title?: string; children: ReactNode; className?: string};

/** A titled block of a sheet: small spaced label, then a softly lit panel. */
export const SheetSection = ({title, children, className}: SheetSectionProps) => (
    <section className={cn("mt-6 first:mt-0", className)}>
        {title && <h3 className="section-label mb-2.5 px-1">{title}</h3>}
        <div className="sheet-panel rounded-2xl p-4">{children}</div>
    </section>
);

/** Plain paragraphs of explanation inside a section. */
export const SheetText = ({children}: {children: ReactNode}) => <p className="text-[14px] leading-relaxed font-light text-muted-foreground">{children}</p>;

type StatRowsProps = {rows: {label: ReactNode; value: ReactNode; key?: string}[]};

/** Label → value rows divided by hairlines. */
export const StatRows = ({rows}: StatRowsProps) => (
    <dl>
        {rows.map((row, index) => (
            <div key={row.key ?? index} className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 text-[14px] font-light first:pt-0 last:border-b-0 last:pb-0">
                <dt className="min-w-0 truncate text-muted-foreground">{row.label}</dt>
                <dd className="shrink-0 tracking-[0.04em] tabular">{row.value}</dd>
            </div>
        ))}
    </dl>
);

type HeadlineProps = {value: ReactNode; label?: ReactNode; aside?: ReactNode};

/** The big reading at the top of a sheet (it switches to the scrubbed hour while dragging over a chart). */
export const Headline = ({value, label, aside}: HeadlineProps) => (
    <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
            <p className="text-[2.75rem] leading-none font-extralight tracking-tight tabular">{value}</p>
            {label && <p className="mt-2 truncate text-[12px] font-light tracking-[0.18em] text-muted-foreground uppercase">{label}</p>}
        </div>
        {aside}
    </div>
);
