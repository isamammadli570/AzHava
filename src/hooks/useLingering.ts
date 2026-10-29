import {useEffect, useState} from "react";

/**
 * Keeps something mounted while it fades out, then unmounts it. Hidden-but-mounted decorations would keep
 * animating at opacity 0 and still cost frames; this lets them disappear for real once the fade is done.
 */
export const useLingering = (isVisible: boolean, fadeMs: number): boolean => {
    const [isMounted, setIsMounted] = useState(isVisible);
    if (isVisible && !isMounted) setIsMounted(true);

    useEffect(() => {
        if (isVisible) return;
        const timer = window.setTimeout(() => setIsMounted(false), fadeMs);
        return () => window.clearTimeout(timer);
    }, [isVisible, fadeMs]);

    return isMounted;
};
