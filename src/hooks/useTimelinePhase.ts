import {useState} from "react";

/**
 * A negative `animation-delay` that pins a looping CSS animation to the page clock: animations with the same period
 * then run in step even when they mount at different moments (the sky's lightning and the hero's bolt flash together).
 */
export const useTimelinePhase = (periodSeconds: number): string => {
    const [delay] = useState(() => `${-((performance.now() / 1000) % periodSeconds).toFixed(3)}s`);
    return delay;
};
