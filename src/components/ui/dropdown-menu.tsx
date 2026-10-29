import type {ComponentProps} from "react";
import {DropdownMenu as DropdownMenuPrimitive} from "radix-ui";
import {Check} from "lucide-react";
import {cn} from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuContent({className, sideOffset = 8, ...props}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                sideOffset={sideOffset}
                className={cn(
                    "z-50 min-w-40 overflow-hidden rounded-2xl border border-glass-border bg-surface p-1.5 text-foreground shadow-2xl backdrop-blur-xl",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuRadioItem({className, children, ...props}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-xl py-2 pr-8 pl-3 text-sm outline-none select-none data-[highlighted]:bg-glass-hover data-[state=checked]:text-brand",
                className,
            )}
            {...props}
        >
            {children}
            <DropdownMenuPrimitive.ItemIndicator className="absolute right-2.5">
                <Check className="size-4"/>
            </DropdownMenuPrimitive.ItemIndicator>
        </DropdownMenuPrimitive.RadioItem>
    );
}

export {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem};
