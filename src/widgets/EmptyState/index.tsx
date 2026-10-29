import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

type EmptyStateProps = {icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string};

export const EmptyState = ({icon, title, description, action, className}: EmptyStateProps) => (
    <div className={cn("glass mx-auto flex max-w-md animate-fade-up flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center", className)}>
        {icon && <div className="text-muted-foreground [&_svg]:size-10">{icon}</div>}
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
    </div>
);
