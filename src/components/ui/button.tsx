import type {ComponentProps} from "react";
import {Slot} from "radix-ui";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,transform,box-shadow] duration-(--duration-fast) outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                brand: "bg-brand text-brand-ink shadow-[0_8px_30px_-8px_var(--brand-glow)] hover:brightness-105",
                glass: "glass text-foreground hover:bg-glass-hover",
                solid: "bg-white/90 text-slate-900 shadow-[0_8px_30px_-10px_rgb(255_255_255/0.5)] hover:bg-white",
                ghost: "text-muted-foreground hover:bg-glass-hover hover:text-foreground",
            },
            size: {
                sm: "h-8 rounded-full px-3 text-xs",
                md: "h-10 rounded-full px-4 text-sm",
                icon: "size-10 rounded-full",
                "icon-sm": "size-8 rounded-full",
            },
        },
        defaultVariants: {variant: "glass", size: "md"},
    },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {asChild?: boolean};

function Button({className, variant, size, asChild = false, type = "button", ...props}: ButtonProps) {
    const Component = asChild ? Slot.Root : "button";
    return <Component data-slot="button" type={asChild ? undefined : type} className={cn(buttonVariants({variant, size}), className)} {...props}/>;
}

export {Button, buttonVariants};
