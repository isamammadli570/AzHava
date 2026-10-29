import {useEffect} from "react";

/**
 * Feeds the pointer position to the `.spotlight` card under it (as --mx/--my), so a soft light follows the cursor.
 * One passive listener for the whole app, throttled to animation frames; skipped on touch screens.
 */
export const useSpotlight = () => {
    useEffect(() => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        let frame = 0;
        let lastEvent: PointerEvent | null = null;

        const apply = () => {
            frame = 0;
            const target = lastEvent?.target;
            if (!lastEvent || !(target instanceof Element)) return;
            const card = target.closest<HTMLElement>(".spotlight");
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${lastEvent.clientX - rect.left}px`);
            card.style.setProperty("--my", `${lastEvent.clientY - rect.top}px`);
        };

        const onMove = (event: PointerEvent) => {
            lastEvent = event;
            if (!frame) frame = requestAnimationFrame(apply);
        };

        document.addEventListener("pointermove", onMove, {passive: true});
        return () => {
            document.removeEventListener("pointermove", onMove);
            cancelAnimationFrame(frame);
        };
    }, []);
};
