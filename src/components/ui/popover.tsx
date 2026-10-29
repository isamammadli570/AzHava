import type {ComponentProps} from "react";
import {Popover as PopoverPrimitive} from "radix-ui";
import {cn} from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({className, sideOffset = 8, ...props}: ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                sideOffset={sideOffset}
                collisionPadding={12}
                className={cn(
                    "z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-glass-border bg-surface p-4 text-sm leading-relaxed text-foreground shadow-2xl outline-none",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    className,
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

export {Popover, PopoverTrigger, PopoverContent};
