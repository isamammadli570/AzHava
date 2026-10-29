import {useId} from "react";
import {CONDITION, conditionFromCode, intensityFromCode, type Condition, type Intensity} from "@/helpers/weather";
import {cn} from "@/lib/utils";

const CLOUD_PATH = "M18 48h28a10 10 0 0 0 0-20h-.6A13 13 0 0 0 20.5 30.5 8.75 8.75 0 0 0 18 48z";

type Gradients = {sun: string; cloud: string; darkCloud: string; backCloud: string; moon: string};

const Sun = ({ids, x, y, r}: {ids: Gradients; x: number; y: number; r: number}) => (
    <g>
        <circle className="wi-glow" cx={x} cy={y} r={r * 1.55} fill="#ffc857" opacity=".22"/>
        <g className="wi-spin" stroke="#ffc857" strokeWidth={r / 6} strokeLinecap="round">
            {Array.from({length: 8}, (_, index) => {
                const angle = (index * Math.PI) / 4;
                const inner = r * 1.3;
                const outer = r * 1.7;
                return <line key={index} x1={x + Math.cos(angle) * inner} y1={y + Math.sin(angle) * inner} x2={x + Math.cos(angle) * outer} y2={y + Math.sin(angle) * outer}/>;
            })}
        </g>
        <circle cx={x} cy={y} r={r} fill={`url(#${ids.sun})`}/>
    </g>
);

const Moon = ({ids, x, y, r}: {ids: Gradients; x: number; y: number; r: number}) => (
    <g>
        <circle className="wi-glow" cx={x} cy={y} r={r * 1.5} fill="#c7d6ff" opacity=".16"/>
        <path d={`M${x + r * 0.35} ${y - r} A${r} ${r} 0 1 0 ${x + r} ${y + r * 0.35} A${r * 0.78} ${r * 0.78} 0 0 1 ${x + r * 0.35} ${y - r}z`} fill={`url(#${ids.moon})`}/>
    </g>
);

const Cloud = ({fill, transform, className}: {fill: string; transform?: string; className?: string}) => (
    <g transform={transform}>
        <path className={className} d={CLOUD_PATH} fill={fill}/>
    </g>
);

const DROP_XS = [24, 32, 40, 28, 36];

const Drops = ({intensity}: {intensity: Intensity}) => (
    <g stroke="#7dd3fc" strokeWidth="2.4" strokeLinecap="round">
        {DROP_XS.slice(0, 1 + intensity).map((x, index) => (
            <line key={x} className="wi-drop" style={{animationDelay: `${index * 0.27}s`}} x1={x} y1="47" x2={x - 2} y2="53"/>
        ))}
    </g>
);

const Flakes = ({intensity}: {intensity: Intensity}) => (
    <g fill="#f4f8ff">
        {DROP_XS.slice(0, 2 + Math.min(intensity, 2)).map((x, index) => (
            <circle key={x} className="wi-flake" style={{animationDelay: `${index * 0.6}s`}} cx={x} cy="51" r="2.1"/>
        ))}
    </g>
);

const Bolt = () => <path className="wi-flash" d="M34 42l-8 11h6l-3 9 10-13h-6l3-7z" fill="#ffd54a" stroke="#ff9f1c" strokeWidth=".8" strokeLinejoin="round"/>;

const FogLines = () => (
    <g stroke="#e2e8f0" strokeWidth="2.6" strokeLinecap="round" opacity=".85">
        <line className="wi-fog" x1="14" y1="52" x2="42" y2="52"/>
        <line className="wi-fog" style={{animationDelay: "-2s"}} x1="22" y1="58" x2="50" y2="58"/>
    </g>
);

const Scene = ({condition, intensity, isDay, ids}: {condition: Condition; intensity: Intensity; isDay: boolean; ids: Gradients}) => {
    const Celestial = isDay ? Sun : Moon;
    const raised = "translate(0 -7)";

    switch (condition) {
        case CONDITION.CLEAR:
            return <Celestial ids={ids} x={32} y={32} r={13}/>;
        case CONDITION.PARTLY_CLOUDY:
            return (
                <>
                    <Celestial ids={ids} x={25} y={22} r={10}/>
                    <Cloud className="wi-drift" fill={`url(#${ids.cloud})`} transform="translate(4 4)"/>
                </>
            );
        case CONDITION.CLOUDY:
            return (
                <>
                    <Cloud fill={`url(#${ids.backCloud})`} transform="translate(9 -8) scale(.8)"/>
                    <Cloud className="wi-drift" fill={`url(#${ids.cloud})`} transform="translate(-2 2)"/>
                </>
            );
        case CONDITION.FOG:
            return (
                <>
                    <Cloud className="wi-drift" fill={`url(#${ids.backCloud})`} transform={raised}/>
                    <FogLines/>
                </>
            );
        case CONDITION.SNOW:
            return (
                <>
                    <Cloud className="wi-drift" fill={`url(#${ids.cloud})`} transform={raised}/>
                    <Flakes intensity={intensity}/>
                </>
            );
        case CONDITION.THUNDER:
            return (
                <>
                    <Cloud className="wi-drift" fill={`url(#${ids.darkCloud})`} transform={raised}/>
                    <Bolt/>
                </>
            );
        default:
            return (
                <>
                    <Cloud className="wi-drift" fill={`url(#${ids.darkCloud})`} transform={raised}/>
                    <Drops intensity={condition === CONDITION.DRIZZLE ? 1 : intensity}/>
                </>
            );
    }
};

type WeatherIconProps = {
    code: number;
    isDay?: boolean;
    size?: number;
    isAnimated?: boolean;
    /** Leave empty when the condition is already written next to the icon. */
    label?: string;
    className?: string;
};

/** Hand-drawn SVG weather icon for a WMO code, with gentle looping motion (stopped by reduced-motion). */
export const WeatherIcon = ({code, isDay = true, size = 48, isAnimated = true, label, className}: WeatherIconProps) => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const ids: Gradients = {sun: `${uid}s`, cloud: `${uid}c`, darkCloud: `${uid}d`, backCloud: `${uid}b`, moon: `${uid}m`};

    return (
        <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            role={label ? "img" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn("shrink-0 overflow-visible drop-shadow-[0_6px_14px_rgb(0_0_0/0.25)]", !isAnimated && "wi-static", className)}
        >
            <defs>
                <radialGradient id={ids.sun} cx="35%" cy="35%" r="75%">
                    <stop offset="0" stopColor="#fff1b8"/>
                    <stop offset=".45" stopColor="#ffc857"/>
                    <stop offset="1" stopColor="#ff9f1c"/>
                </radialGradient>
                <linearGradient id={ids.moon} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fdfcf5"/>
                    <stop offset="1" stopColor="#c9d3ee"/>
                </linearGradient>
                <linearGradient id={ids.cloud} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ffffff"/>
                    <stop offset="1" stopColor="#d3def0"/>
                </linearGradient>
                <linearGradient id={ids.backCloud} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#dbe4f1"/>
                    <stop offset="1" stopColor="#a9b8cd"/>
                </linearGradient>
                <linearGradient id={ids.darkCloud} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#d4dceb"/>
                    <stop offset="1" stopColor="#8a98ae"/>
                </linearGradient>
            </defs>
            <Scene condition={conditionFromCode(code)} intensity={intensityFromCode(code)} isDay={isDay} ids={ids}/>
        </svg>
    );
};
