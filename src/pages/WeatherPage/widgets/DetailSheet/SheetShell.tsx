import {useRef, type PointerEvent, type ReactNode} from "react";
import {X} from "lucide-react";
import {Dialog} from "radix-ui";
import {useTranslation} from "react-i18next";
import {cn} from "@/lib/utils";

const DISMISS_DISTANCE = 120;
const DISMISS_SPEED = 0.6;

type SheetShellProps = {
    open: boolean;
    onClose: () => void;
    icon: ReactNode;
    title: string;
    /** Night black with no visible title (the moon sheet, like iOS); the title stays for screen readers. */
    isNight?: boolean;
    children: ReactNode;
};

/**
 * The frame of every detail sheet. On phones it is a bottom sheet that slides up and can be dragged down by its top
 * bar to dismiss; on wider screens a centred panel. Esc, the × button, tapping outside and the back button close it.
 */
export const SheetShell = ({open, onClose, icon, title, isNight = false, children}: SheetShellProps) => {
    const {t} = useTranslation("weather");
    const contentRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{startY: number; startTime: number; offset: number} | null>(null);

    const setOffset = (offset: number, animate: boolean) => {
        const content = contentRef.current;
        if (!content) return;
        content.style.transition = animate ? "transform 260ms var(--ease-out)" : "none";
        content.style.transform = offset > 0 ? `translate3d(0, ${offset}px, 0)` : "";
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        // Only the phone sheet drags; the desktop panel stays put.
        if (!window.matchMedia("(max-width: 639px)").matches) return;
        drag.current = {startY: event.clientY, startTime: performance.now(), offset: 0};
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        drag.current.offset = Math.max(0, event.clientY - drag.current.startY);
        setOffset(drag.current.offset, false);
    };
    const onPointerUp = () => {
        const state = drag.current;
        drag.current = null;
        if (!state) return;
        const speed = state.offset / Math.max(1, performance.now() - state.startTime);
        if (state.offset > DISMISS_DISTANCE || speed > DISMISS_SPEED) onClose();
        else setOffset(0, true);
    };

    return (
        <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/60"/>
                <Dialog.Content ref={contentRef} aria-describedby={undefined} className={cn("sheet fixed z-50 flex flex-col overflow-hidden outline-none", isNight && "sheet-night")}>
                    <div
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        className="relative shrink-0 touch-none px-4 pt-2.5 pb-3 sm:touch-auto sm:pt-4"
                    >
                        <span aria-hidden className="mx-auto mb-2.5 block h-1 w-10 rounded-full bg-white/25 sm:hidden"/>
                        <div className={cn("flex items-center justify-center gap-2 px-10", isNight && "sr-only")}>
                            <span className="text-muted-foreground [&_svg]:size-4" aria-hidden>{icon}</span>
                            <Dialog.Title className="truncate text-[12px] font-medium tracking-[0.2em] uppercase">{title}</Dialog.Title>
                        </div>
                        <Dialog.Close
                            aria-label={t("sheet.close")}
                            className="absolute top-1/2 right-3 grid size-8 translate-y-[calc(-50%+4px)] place-items-center rounded-full bg-white/10 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:translate-y-[calc(-50%+2px)]"
                        >
                            <X className="size-4" strokeWidth={1.75}/>
                        </Dialog.Close>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6">{children}</div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
