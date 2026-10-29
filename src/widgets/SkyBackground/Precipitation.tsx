import {useEffect, useRef} from "react";
import type {Intensity} from "@/helpers/weather";
import {useReducedMotion} from "@/hooks/useReducedMotion";

export type PrecipitationKind = "rain" | "snow";

type Particle = {x: number; y: number; speed: number; size: number; phase: number; bucket: number};

const DENSITY: Record<PrecipitationKind, readonly number[]> = {rain: [0, 120, 220, 340], snow: [0, 80, 140, 210]};

/** Particles share a few opacity levels, so each level is drawn as one path with one stroke/fill call. */
const ALPHAS: Record<PrecipitationKind, readonly number[]> = {rain: [0.18, 0.3, 0.46], snow: [0.45, 0.7, 0.95]};

/** Particles are tuned for a 1440 px wide screen and thinned on phones, so a small screen is not a white wall. */
const particleCount = (kind: PrecipitationKind, intensity: Intensity, width: number): number =>
    Math.round(DENSITY[kind][intensity] * Math.min(1.2, Math.max(0.35, width / 1440)));

const spawn = (kind: PrecipitationKind, width: number, height: number, anywhere: boolean): Particle => {
    const bucket = Math.floor(Math.random() * 3);
    return {
        x: Math.random() * (width + 200) - 100,
        y: anywhere ? Math.random() * height : -20 - Math.random() * 80,
        // Brighter (nearer) drops fall faster and are larger: a cheap depth illusion.
        speed: kind === "rain" ? 800 + bucket * 280 + Math.random() * 200 : 25 + bucket * 22 + Math.random() * 20,
        size: kind === "rain" ? 10 + bucket * 6 + Math.random() * 6 : 1 + bucket * 0.9 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        bucket,
    };
};

type PrecipitationProps = {kind: PrecipitationKind | null; intensity: Intensity; isStorm: boolean};

/**
 * Canvas rain or snow. Rendered at device-pixel ratio 1 (streaks do not need retina sharpness, and it is a quarter of
 * the pixels on a 2× phone), batched into three draw calls per frame, paused while the tab is hidden, and a single
 * static frame under reduced motion.
 */
export const Precipitation = ({kind, intensity, isStorm}: PrecipitationProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isReduced = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", {alpha: true});
        if (!canvas || !context || !kind || intensity === 0) return;

        let width = 0;
        let height = 0;
        let particles: Particle[] = [];
        let frame = 0;
        let last = performance.now();
        const wind = kind === "rain" ? (isStorm ? 0.32 : 0.16) : 0;
        const alphas = ALPHAS[kind];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            particles = Array.from({length: particleCount(kind, intensity, width)}, () => spawn(kind, width, height, true));
        };

        const step = (delta: number) => {
            for (const particle of particles) {
                particle.y += particle.speed * delta;
                if (kind === "rain") particle.x += particle.speed * wind * delta;
                else {
                    particle.phase += delta * 1.4;
                    particle.x += Math.sin(particle.phase) * 18 * delta;
                }
                if (particle.y - particle.size > height || particle.x > width + 120) Object.assign(particle, spawn(kind, width, height, false));
            }
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            context.lineCap = "round";
            context.lineWidth = 1.1;
            alphas.forEach((alpha, bucket) => {
                context.beginPath();
                for (const particle of particles) {
                    if (particle.bucket !== bucket) continue;
                    if (kind === "rain") {
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(particle.x - particle.size * wind, particle.y - particle.size);
                    } else {
                        context.moveTo(particle.x + particle.size, particle.y);
                        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    }
                }
                if (kind === "rain") {
                    context.strokeStyle = `rgba(205, 225, 255, ${alpha})`;
                    context.stroke();
                } else {
                    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    context.fill();
                }
            });
        };

        const tick = (time: number) => {
            // Clamp the step so a backgrounded tab does not teleport every particle on return.
            const delta = Math.min(0.05, (time - last) / 1000);
            last = time;
            step(delta);
            draw();
            frame = requestAnimationFrame(tick);
        };

        const onVisibility = () => {
            cancelAnimationFrame(frame);
            if (document.visibilityState === "visible" && !isReduced) {
                last = performance.now();
                frame = requestAnimationFrame(tick);
            }
        };

        resize();
        if (isReduced) draw();
        else frame = requestAnimationFrame(tick);

        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVisibility);
            context.clearRect(0, 0, width, height);
        };
    }, [kind, intensity, isStorm, isReduced]);

    return <canvas ref={canvasRef} className="absolute inset-0 size-full"/>;
};
