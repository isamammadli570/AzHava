import {useSyncExternalStore} from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
    const media = window.matchMedia(QUERY);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** Live `prefers-reduced-motion`; JS-driven animation (canvas, counters) checks it, CSS handles the rest. */
export const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => false);
