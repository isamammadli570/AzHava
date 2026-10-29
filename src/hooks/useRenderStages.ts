import {startTransition, useEffect, useState} from "react";

/**
 * Mounts a page in stages, one painted frame apart: returns 1 on the first render, then 2, 3… up to `total`.
 * A big page inserted at once costs one long frame of style, layout and paint (a visible hitch on phones); a few
 * ~16 ms steps cost the same work spread out, and each part's own entrance animation hides the difference.
 */
export const useRenderStages = (total: number): number => {
    const [stage, setStage] = useState(1);

    useEffect(() => {
        if (stage >= total) return;
        // rAF runs just before the next paint; the timeout queued from it runs just after, so every stage gets painted
        // on its own before the next one is added.
        let timer = 0;
        const frame = requestAnimationFrame(() => {
            timer = window.setTimeout(() => startTransition(() => setStage((current) => current + 1)));
        });
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(timer);
        };
    }, [stage, total]);

    return stage;
};
