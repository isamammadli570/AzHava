import {useEffect, useId, useMemo, useRef, useState} from "react";
import moonPhoto from "@/assets/moon.webp";
import {litMoonPath, moonView, type MoonView} from "@/helpers/moon";
import {cn} from "@/lib/utils";
import {onMoonReady, renderMoon, supportsMoonRenderer} from "@/widgets/MoonDisc/moonRenderer";

type MoonDiscProps = {
    /** The moment (unix seconds): it sets the phase, where the light comes from and the libration. */
    time: number;
    /** Light on the night side (linear, about 0.02–0.05): the faint earthshine that keeps the whole disc visible. */
    earthshine?: number;
    className?: string;
};

/**
 * The moon as a lit sphere wrapped in NASA's LRO colour map (the flat fallback uses an SVS full-moon photograph),
 * north up and lit from the sun's side as at that moment, like iOS Weather: the terminator falls off softly over the
 * curved surface, the night side keeps a little earthshine, and the face nods slowly (libration) as time moves.
 * Without WebGL it falls back to the flat photo with the phase shaded over it.
 */
export const MoonDisc = ({time, earthshine = 0.012, className}: MoonDiscProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const view = useMemo(() => moonView(time), [time]);
    const [isSupported] = useState(supportsMoonRenderer);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => (isSupported ? onMoonReady(() => setIsReady(true)) : undefined), [isSupported]);

    // Draw at the element's real pixel size, again whenever it is resized.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isReady) return;
        const draw = () => {
            // Twice the screen's density, scaled down by the browser: a supersampled, smooth limb.
            const scale = Math.min((window.devicePixelRatio || 1) * 2, 4);
            const size = Math.round(canvas.clientWidth * scale);
            if (size === 0) return;
            if (canvas.width !== size) {
                canvas.width = size;
                canvas.height = size;
            }
            renderMoon(canvas, view, earthshine);
        };
        draw();
        const observer = new ResizeObserver(draw);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [view, earthshine, isReady]);

    if (!isSupported) return <FlatMoon view={view} className={className}/>;
    return <canvas ref={canvasRef} aria-hidden className={cn("block aspect-square shrink-0 rounded-full", className)}/>;
};

/** The fallback: the photo with the unlit part shaded over it along the terminator's half-ellipse. */
const FlatMoon = ({view, className}: {view: MoonView; className?: string}) => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const lit = litMoonPath(view.phase, 50, 50);

    return (
        <span aria-hidden className={cn("relative block shrink-0 rounded-full", className)}>
            <img src={moonPhoto} alt="" draggable={false} decoding="async" className="size-full rounded-full select-none"/>
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
                <defs>
                    <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="1.4"/>
                    </filter>
                    <mask id={`${uid}-shade`}>
                        <rect width="100" height="100" fill="white"/>
                        <path d={lit} fill="black" filter={`url(#${uid}-soft)`}/>
                    </mask>
                </defs>
                <circle cx="50" cy="50" r="50.5" fill="rgb(5 7 11)" fillOpacity={0.8} mask={`url(#${uid}-shade)`}/>
            </svg>
        </span>
    );
};
