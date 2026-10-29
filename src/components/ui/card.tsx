import type {ComponentProps, ReactNode} from "react";
import {cn} from "@/lib/utils";

function Card({className, ...props}: ComponentProps<"section">) {
    return <section data-slot="card" className={cn("glass rounded-3xl p-4 sm:p-5", className)} {...props}/>;
}

type CardHeaderProps = {icon?: ReactNode; title: ReactNode; actions?: ReactNode; className?: string; id?: string};

/** Small-caps heading row used by every card: icon, title, optional controls on the right. */
function CardHeader({icon, title, actions, className, id}: CardHeaderProps) {
    return (
        <div className={cn("mb-3 flex min-h-8 items-center justify-between gap-2", className)}>
            <h2 id={id} className="section-label flex min-w-0 items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
                {icon}
                {title}
            </h2>
            {actions}
        </div>
    );
}

export {Card, CardHeader};
