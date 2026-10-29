import {useEffect, useRef} from "react";

const isTypingTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Runs `handler` when `key` is pressed outside a text field. */
export const useHotkey = (key: string, handler: () => void) => {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== key || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
            event.preventDefault();
            handlerRef.current();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [key]);
};
