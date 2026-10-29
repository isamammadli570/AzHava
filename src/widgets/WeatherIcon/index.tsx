import type {CSSProperties, ReactNode} from "react";
import {CONDITION, conditionFromCode, intensityFromCode, type Condition, type Intensity} from "@/helpers/weather";
import {cn} from "@/lib/utils";

const CLOUD_PATH = "M18 48h28a10 10 0 0 0 0-20h-.6A13 13 0 0 0 20.5 30.5 8.75 8.75 0 0 0 18 48z";

/** Shared gradient ids, defined once by `WeatherIconDefs` instead of five gradients inside every icon. */
const FILL = {
    sun: "url(#wi-sun)",
    moon: "url(#wi-moon)",
    cloud: "url(#wi-cloud)",
    backCloud: "url(#wi-cloud-back)",
    darkCloud: "url(#wi-cloud-dark)",
} as const;

/** Mount once near the root. Hidden with size 0 rather than `display: none`, which would disable the gradients. */
export const WeatherIconDefs = () => (
    <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
            <radialGradient id="wi-sun" cx="35%" cy="35%" r="75%">
                <stop offset="0" stopColor="#fff1b8"/>
                <stop offset=".45" stopColor="#ffc857"/>
                <stop offset="1" stopColor="#ff9f1c"/>
            </radialGradient>
            <linearGradient id="wi-moon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fdfcf5"/>
                <stop offset="1" stopColor="#c9d3ee"/>
            </linearGradient>
            <linearGradient id="wi-cloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff"/>
                <stop offset="1" stopColor="#d3def0"/>
            </linearGradient>
            <linearGradient id="wi-cloud-back" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#dbe4f1"/>
                <stop offset="1" stopColor="#a9b8cd"/>
            </linearGradient>
            <linearGradient id="wi-cloud-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d4dceb"/>
                <stop offset="1" stopColor="#8a98ae"/>
            </linearGradient>
        </defs>
    </svg>
);

type Motion = "spin" | "glow" | "drift" | "drop" | "flake" | "flash" | "fog";

/**
 * One visual part of an icon. Moving parts become their own <svg> so the animation runs on the element itself:
 * a transform/opacity on an HTML-level box is composited on the GPU, while animating shapes *inside* an SVG
 * forces layout and paint on the main thread every frame.
 */
type Layer = {key: string; content: ReactNode; motion?: Motion; origin?: [x: number, y: number]; delay?: number};

const sunLayers = (x: number, y: number, r: number): Layer[] => [
    {key: "glow", motion: "glow", origin: [x, y], content: <circle cx={x} cy={y} r={r * 1.55} fill="#ffc857" opacity=".22"/>},
    {
        key: "rays",
        motion: "spin",
        origin: [x, y],
        content: (
            <g stroke="#ffc857" strokeWidth={r / 6} strokeLinecap="round">
                {Array.from({length: 8}, (_, index) => {
                    const angle = (index * Math.PI) / 4;
                    return <line key={index} x1={x + Math.cos(angle) * r * 1.3} y1={y + Math.sin(angle) * r * 1.3} x2={x + Math.cos(angle) * r * 1.7} y2={y + Math.sin(angle) * r * 1.7}/>;
                })}
            </g>
        ),
    },
    {key: "sun", content: <circle cx={x} cy={y} r={r} fill={FILL.sun}/>},
];

const moonLayers = (x: number, y: number, r: number): Layer[] => [
    {key: "glow", motion: "glow", origin: [x, y], content: <circle cx={x} cy={y} r={r * 1.5} fill="#c7d6ff" opacity=".16"/>},
    {key: "moon", content: <path d={`M${x + r * 0.35} ${y - r} A${r} ${r} 0 1 0 ${x + r} ${y + r * 0.35} A${r * 0.78} ${r * 0.78} 0 0 1 ${x + r * 0.35} ${y - r}z`} fill={FILL.moon}/>},
];

const cloud = (key: string, fill: string, transform: string | undefined, motion?: Motion): Layer => ({
    key,
    motion,
    content: (
        <g transform={transform}>
            <path d={CLOUD_PATH} fill={fill}/>
        </g>
    ),
});

const DROP_XS = [24, 32, 40, 28, 36];
const RAISED = "translate(0 -7)";

const buildLayers = (condition: Condition, intensity: Intensity, isDay: boolean): Layer[] => {
    const celestial = isDay ? sunLayers : moonLayers;

    switch (condition) {
        case CONDITION.CLEAR:
            return celestial(32, 32, 13);
        case CONDITION.PARTLY_CLOUDY:
            return [...celestial(25, 22, 10), cloud("cloud", FILL.cloud, "translate(4 4)", "drift")];
        case CONDITION.CLOUDY:
            return [cloud("back", FILL.backCloud, "translate(9 -8) scale(.8)"), cloud("cloud", FILL.cloud, "translate(-2 2)", "drift")];
        case CONDITION.FOG:
            return [
                cloud("cloud", FILL.backCloud, RAISED, "drift"),
                {key: "fog-1", motion: "fog", content: <line x1="14" y1="52" x2="42" y2="52" stroke="#e2e8f0" strokeWidth="2.6" strokeLinecap="round" opacity=".85"/>},
                {key: "fog-2", motion: "fog", delay: -2, content: <line x1="22" y1="58" x2="50" y2="58" stroke="#e2e8f0" strokeWidth="2.6" strokeLinecap="round" opacity=".85"/>},
            ];
        case CONDITION.SNOW:
            return [
                cloud("cloud", FILL.cloud, RAISED, "drift"),
                ...DROP_XS.slice(0, 2 + Math.min(intensity, 2)).map((x, index): Layer => ({
                    key: `flake-${x}`,
                    motion: "flake",
                    origin: [x, 51],
                    delay: index * 0.6,
                    content: <circle cx={x} cy="51" r="2.1" fill="#f4f8ff"/>,
                })),
            ];
        case CONDITION.THUNDER:
            return [
                cloud("cloud", FILL.darkCloud, RAISED, "drift"),
                {key: "bolt", motion: "flash", content: <path d="M34 42l-8 11h6l-3 9 10-13h-6l3-7z" fill="#ffd54a" stroke="#ff9f1c" strokeWidth=".8" strokeLinejoin="round"/>},
            ];
        default: {
            const drops = condition === CONDITION.DRIZZLE ? 1 : intensity;
            return [
                cloud("cloud", FILL.darkCloud, RAISED, "drift"),
                ...DROP_XS.slice(0, 1 + drops).map((x, index): Layer => ({
                    key: `drop-${x}`,
                    motion: "drop",
                    delay: index * 0.27,
                    content: <line x1={x} y1="47" x2={x - 2} y2="53" stroke="#7dd3fc" strokeWidth="2.4" strokeLinecap="round"/>,
                })),
            ];
        }
    }
};

const layerStyle = ({origin, delay}: Layer): CSSProperties => ({
    transformOrigin: origin ? `${(origin[0] / 64) * 100}% ${(origin[1] / 64) * 100}%` : undefined,
    animationDelay: delay ? `${delay}s` : undefined,
});

type WeatherIconProps = {
    code: number;
    isDay?: boolean;
    size?: number;
    /** Animated icons cost a few GPU layers each; keep it to the ones in focus (hero, current hour). */
    isAnimated?: boolean;
    /** Leave empty when the condition is already written next to the icon. */
    label?: string;
    className?: string;
};

/** Hand-drawn SVG weather icon for a WMO code, with gentle looping motion (stopped by reduced-motion). */
export const WeatherIcon = ({code, isDay = true, size = 48, isAnimated = true, label, className}: WeatherIconProps) => {
    const layers = buildLayers(conditionFromCode(code), intensityFromCode(code), isDay);
    const a11y = label ? {role: "img", "aria-label": label} : {"aria-hidden": true};

    // A still icon is one flat <svg>: the cheapest thing to draw, used for lists of days and cities.
    if (!isAnimated) {
        return (
            <svg viewBox="0 0 64 64" width={size} height={size} {...a11y} className={cn("shrink-0 overflow-visible drop-shadow-[0_6px_14px_rgb(0_0_0/0.25)]", className)}>
                {layers.map((layer) => <g key={layer.key}>{layer.content}</g>)}
            </svg>
        );
    }

    return (
        // Size through a CSS variable (not inline width) so responsive classes like `sm:size-40` can still win.
        <span {...a11y} className={cn("relative inline-block size-(--wi-size) shrink-0", className)} style={{"--wi-size": `${size}px`} as CSSProperties}>
            {layers.map((layer) => (
                <svg key={layer.key} viewBox="0 0 64 64" className={cn("absolute inset-0 size-full overflow-visible", layer.motion && `wi-${layer.motion}`)} style={layerStyle(layer)}>
                    {layer.content}
                </svg>
            ))}
        </span>
    );
};
