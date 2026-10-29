import type {CSSProperties} from "react";
import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Position of an item inside a `stagger` container; the CSS turns it into an entrance delay. */
export const staggerIndex = (index: number): CSSProperties => ({"--i": index}) as CSSProperties;
