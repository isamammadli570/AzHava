import {useState, type CSSProperties} from "react";
import {CONDITION, skyClass, type Scene} from "@/helpers/weather";
import {cn} from "@/lib/utils";
import {Precipitation, type PrecipitationKind} from "@/widgets/SkyBackground/Precipitation";

/** Deterministic pseudo-random numbers, so stars and clouds sit in the same place on every render. */
const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const random = seeded(42);
const STARS = Array.from({length: 70}, () => ({
    left: random() * 100,
    top: random() * 70,
    size: 1 + random() * 1.8,
    duration: 2.5 + random() * 4,
    delay: -random() * 6,
}));

const CLOUDS = Array.from({length: 9}, (_, index) => {
    const duration = 80 + random() * 90;
    return {
        top: -4 + random() * 52,
        width: 320 + random() * 420,
        duration,
        // A negative delay starts each cloud part-way across, so the sky is never empty on load.
        delay: -random() * duration,
        rest: random() * 90,
        opacity: 0.55 + random() * 0.45,
        order: index,
    };
});

const METEORS = [
    {top: 8, left: 62, duration: 9, delay: 2},
    {top: 22, left: 30, duration: 13, delay: 7},
];

const WIND_STREAKS = Array.from({length: 7}, () => ({
    top: 10 + random() * 75,
    width: 120 + random() * 220,
    duration: 1.6 + random() * 1.6,
    delay: -random() * 3,
}));

const CLOUD_COUNT: Record<Scene["condition"], number> = {clear: 0, partlyCloudy: 4, cloudy: 8, fog: 5, drizzle: 7, rain: 8, snow: 7, thunder: 9};

const cloudColor = ({condition, isDay}: Scene): string => {
    if (condition === CONDITION.THUNDER) return isDay ? "rgb(70 80 98)" : "rgb(38 45 60)";
    if (condition === CONDITION.RAIN || condition === CONDITION.DRIZZLE) return isDay ? "rgb(118 133 154)" : "rgb(48 58 76)";
    if (condition === CONDITION.CLOUDY || condition === CONDITION.FOG) return isDay ? "rgb(196 206 220)" : "rgb(62 72 92)";
    return isDay ? "rgb(255 255 255)" : "rgb(120 135 170)";
};

const precipitationKind = (condition: Scene["condition"]): PrecipitationKind | null => {
    if (condition === CONDITION.SNOW) return "snow";
    if (condition === CONDITION.RAIN || condition === CONDITION.DRIZZLE || condition === CONDITION.THUNDER) return "rain";
    return null;
};

const CloudShape = ({width}: {width: number}) => (
    <svg viewBox="0 0 300 120" width={width} height={width * 0.4} className="blur-[6px]" aria-hidden>
        <path d="M40 110h220a40 40 0 0 0 0-80 60 60 0 0 0-108-12 44 44 0 0 0-72 28A30 30 0 0 0 40 110z" fill="currentColor"/>
    </svg>
);

const fade = (isVisible: boolean) => cn("transition-opacity duration-(--duration-sky)", isVisible ? "opacity-100" : "opacity-0");

type SkyBackgroundProps = {scene: Scene};

/**
 * The living backdrop: a gradient per sky that cross-fades on change, sun with god rays or moon with shooting stars,
 * drifting clouds, fog, canvas rain/snow, lightning, wind streaks and the odd rainbow. Decorative only.
 *
 * Built to stay cheap: only two gradient layers exist at a time, stars mount only at night, everything that moves
 * animates `transform`/`opacity` (compositor-only), and the canvas is batched (see `Precipitation`).
 */
export const SkyBackground = ({scene}: SkyBackgroundProps) => {
    const {condition, isDay, intensity, isWindy} = scene;
    const activeClass = skyClass(scene);
    const isClearish = condition === CONDITION.CLEAR || condition === CONDITION.PARTLY_CLOUDY;
    const cloudCount = CLOUD_COUNT[condition];
    const isStorm = condition === CONDITION.THUNDER;
    const hasRainbow = isDay && (condition === CONDITION.DRIZZLE || (condition === CONDITION.RAIN && intensity === 1));

    // The previous gradient stays underneath while the new one fades in on top (state updated during render).
    const [layers, setLayers] = useState({current: activeClass, previous: activeClass});
    if (layers.current !== activeClass) setLayers({current: activeClass, previous: layers.current});

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background [view-transition-name:sky]">
            <div className={cn("absolute inset-0", layers.previous)}/>
            <div key={layers.current} className={cn("absolute inset-0 animate-[fade-in_var(--duration-sky)_var(--ease-in-out)_both]", layers.current)}/>

            {/* Stars and shooting stars */}
            {!isDay && (
                <div className={cn("absolute inset-0 animate-fade-in transition-opacity duration-(--duration-sky)", isClearish ? "opacity-100" : "opacity-20")}>
                    {STARS.map((star, index) => (
                        <span
                            key={index}
                            className="sky-star"
                            style={{left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, "--duration": `${star.duration}s`, "--delay": `${star.delay}s`} as CSSProperties}
                        />
                    ))}
                    {isClearish && METEORS.map((meteor) => (
                        <span
                            key={meteor.left}
                            className="sky-meteor"
                            style={{top: `${meteor.top}%`, left: `${meteor.left}%`, "--duration": `${meteor.duration}s`, "--delay": `${meteor.delay}s`} as CSSProperties}
                        />
                    ))}
                </div>
            )}

            {/* Sun with slow god rays */}
            <div
                className={cn(
                    "absolute top-[-9rem] right-[-9rem] size-[26rem] transition-[opacity,translate] duration-(--duration-sky) ease-(--ease-out) sm:top-[-4rem] sm:right-[6%]",
                    isDay && isClearish ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
                    isDay && condition !== CONDITION.CLEAR && isClearish && "opacity-70",
                )}
            >
                <div className="absolute inset-0 animate-[glow-pulse_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgb(255_220_140/0.55)_0%,rgb(255_200_87/0.18)_35%,transparent_68%)]"/>
                <div className="absolute inset-[5.5rem] animate-[spin_120s_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgb(255_236_179/0.16)_0deg_6deg,transparent_6deg_18deg)] [mask-image:radial-gradient(circle,#000_30%,transparent_70%)]"/>
                <div className="absolute inset-[9.5rem] rounded-full bg-[radial-gradient(circle_at_38%_35%,#fff7d6,#ffd36b_45%,#ffab2e)] shadow-[0_0_80px_30px_rgb(255_200_87/0.45)]"/>
            </div>
            <div className={cn("absolute inset-0", fade(isDay && isClearish))}>
                <div className="sky-beam absolute top-[-20%] right-[12%] h-[140%] w-40 rotate-[28deg] bg-gradient-to-b from-[rgb(255_236_179/0.16)] to-transparent blur-2xl"/>
                <div className="sky-beam absolute top-[-20%] right-[30%] h-[140%] w-24 rotate-[34deg] bg-gradient-to-b from-[rgb(255_236_179/0.12)] to-transparent blur-2xl [--delay:-4s]"/>
            </div>

            {/* Moon */}
            <div
                className={cn(
                    "absolute top-[3.5rem] right-[8%] size-20 rounded-full transition-[opacity,translate] duration-(--duration-sky) ease-(--ease-out) sm:top-[5rem] sm:size-24",
                    "bg-[radial-gradient(circle_at_35%_35%,#fffdf4,#e3e7f5_55%,#b9c2dc)] shadow-[0_0_70px_24px_rgb(200_215_255/0.22)]",
                    !isDay && isClearish ? "translate-y-0 opacity-100" : !isDay && condition === CONDITION.CLOUDY ? "translate-y-4 opacity-20" : "translate-y-16 opacity-0",
                )}
            >
                <span className="absolute top-[28%] left-[30%] size-[18%] rounded-full bg-[#c9cfe2]/70"/>
                <span className="absolute top-[56%] left-[55%] size-[12%] rounded-full bg-[#c9cfe2]/60"/>
                <span className="absolute top-[62%] left-[26%] size-[9%] rounded-full bg-[#c9cfe2]/50"/>
            </div>

            {/* Rainbow after light rain in daylight */}
            <div className={cn("absolute bottom-[-35vmax] left-[-10vmax] size-[90vmax] rounded-full", fade(hasRainbow))}>
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_56%,rgb(255_80_80/0.16)_57%,rgb(255_170_60/0.16)_59%,rgb(255_235_90/0.14)_61%,rgb(90_220_120/0.12)_63%,rgb(80_160_255/0.12)_65%,rgb(150_100_255/0.1)_67%,transparent_69%)]"/>
            </div>

            {/* Clouds */}
            <div className="absolute inset-0 transition-colors duration-(--duration-sky)" style={{color: cloudColor(scene)}}>
                {CLOUDS.map((cloud) => (
                    <div
                        key={cloud.order}
                        className="sky-cloud transition-opacity duration-(--duration-sky)"
                        style={{
                            top: `${cloud.top}%`,
                            opacity: cloud.order < cloudCount ? cloud.opacity : 0,
                            "--duration": `${cloud.duration / (isWindy ? 2.2 : 1)}s`,
                            "--delay": `${cloud.delay}s`,
                            "--rest": `${cloud.rest}vw`,
                        } as CSSProperties}
                    >
                        <CloudShape width={cloud.width}/>
                    </div>
                ))}
            </div>

            {/* Fog */}
            <div className={cn("absolute inset-x-[-20%] bottom-0 h-2/3", fade(condition === CONDITION.FOG))}>
                <div className="sky-fog absolute inset-x-0 bottom-[10%] h-1/2 rounded-[50%] bg-white/18 blur-3xl"/>
                <div className="sky-fog absolute inset-x-[10%] bottom-[35%] h-1/3 rounded-[50%] bg-white/12 blur-3xl [--duration:22s]"/>
            </div>

            {/* Wind streaks */}
            {isWindy && (
                <div className="absolute inset-0 animate-fade-in">
                    {WIND_STREAKS.map((streak, index) => (
                        <span
                            key={index}
                            className="sky-wind"
                            style={{top: `${streak.top}%`, width: streak.width, "--duration": `${streak.duration}s`, "--delay": `${streak.delay}s`} as CSSProperties}
                        />
                    ))}
                </div>
            )}

            <div className={cn("absolute inset-0", fade(precipitationKind(condition) !== null))}>
                <Precipitation kind={precipitationKind(condition)} intensity={condition === CONDITION.DRIZZLE ? 1 : Math.max(intensity, 1) as Scene["intensity"]} isStorm={isStorm}/>
            </div>

            {isStorm && (
                <>
                    <div className="sky-lightning absolute inset-0 bg-[rgb(205_220_255/0.55)] [--duration:9s]"/>
                    <div className="sky-lightning absolute inset-0 bg-[rgb(205_220_255/0.35)] [--delay:-4.3s] [--duration:13s]"/>
                    <svg viewBox="0 0 60 200" className="sky-bolt absolute top-[8%] left-[18%] h-[42vh] drop-shadow-[0_0_18px_rgb(200_220_255)] [--duration:9s]">
                        <path d="M34 0L12 92h18L16 200 50 74H30L44 0z" fill="rgb(235 242 255)"/>
                    </svg>
                </>
            )}

            {/* Vignette keeps the edges calm and the text readable on bright skies. */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_45%,rgb(2_6_20/0.38)_100%)]"/>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(2_6_20/0.35)] to-transparent"/>
        </div>
    );
};
