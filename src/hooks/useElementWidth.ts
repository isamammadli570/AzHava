import {useLayoutEffect, useRef, useState} from "react";

/** A ref and the live width of the element it is attached to (0 until measured), for charts drawn in real pixels. */
export const useElementWidth = <TElement extends HTMLElement>() => {
    const ref = useRef<TElement>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        setWidth(element.clientWidth);
        const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};
