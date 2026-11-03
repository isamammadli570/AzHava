import type {ComponentProps, ReactNode} from "react";
import {cn} from "@/lib/utils";

function Card({className, ...props}: ComponentProps<"section">) {
    return <section data-slot="card" className={cn("glass rounded-[1.375rem] p-4 sm:p-5", className)} {...props}/>;
}

type CardHeaderProps = {icon?: ReactNode; title: ReactNode; actions?: ReactNode; className?: string; id?: string; hasDivider?: boolean};

/** Small-caps heading row used by every card: icon, title, optional controls; list cards add a hairline under it. */
function CardHeader({icon, title, actions, className, id, hasDivider = false}: CardHeaderProps) {
    return (
        <div className={cn("mb-3 flex min-h-8 items-center justify-between gap-2", hasDivider && "-mx-4 mb-1 border-b border-white/10 px-4 pb-2.5 sm:-mx-5 sm:px-5", className)}>
            <h2 id={id} className="section-label flex min-w-0 items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
                {icon}
                <span className="truncate">{title}</span>
            </h2>
            {actions}
        </div>
    );
}

export {Card, CardHeader};
