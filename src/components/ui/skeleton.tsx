import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";

function Skeleton({className, ...props}: ComponentProps<"div">) {
    return <div data-slot="skeleton" aria-hidden className={cn("skeleton rounded-xl", className)} {...props}/>;
}

export {Skeleton};
