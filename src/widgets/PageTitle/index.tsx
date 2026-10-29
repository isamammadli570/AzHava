import type {ReactNode} from "react";

type PageTitleProps = {title: string; description?: string; actions?: ReactNode};

export const PageTitle = ({title, description, actions}: PageTitleProps) => (
    <header className="flex animate-fade-up flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-shadow-soft sm:text-4xl">{title}</h1>
            {description && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
        {actions}
    </header>
);
