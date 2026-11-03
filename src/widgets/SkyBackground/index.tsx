import {useState, type CSSProperties, type ReactNode} from "react";
import {LIGHTNING_PERIOD_S} from "@/constants/other";
import type {Season} from "@/helpers/season";
import {CONDITION, skyClass, type Scene} from "@/helpers/weather";
import {useLingering} from "@/hooks/useLingering";
import {useTimelinePhase} from "@/hooks/useTimelinePhase";
import {cn} from "@/lib/utils";
import {Precipitation, type PrecipitationKind} from "@/widgets/SkyBackground/Precipitation";

/** Deterministic pseudo-random numbers, so stars, smoke and particles sit in the same place on every render. */
const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const random = seeded(42);
// Timings come from a few shared rhythms (by index): every looping animation wakes the main thread once per loop,
// so fifty different timings would mean a wake-up nearly every frame.
const RHYTHMS = [{duration: 3, delay: 0}, {duration: 4.2, delay: -1.4}, {duration: 5.6, delay: -2.8}];

const STARS = Array.from({length: 50}, (_, index) => ({
    left: random() * 100,
    top: random() * 60,
    size: 0.8 + random() * 1.4,
    ...RHYTHMS[index % RHYTHMS.length],
}));

const SMOKE = Array.from({length: 7}, (_, index) => {
    const duration = 110 + random() * 90;
    return {
        top: -6 + random() * 70,
        width: 420 + random() * 520,
        duration,
        // A negative delay starts each bank part-way across, so the mist is never empty on load.
        delay: -random() * duration,
        rest: random() * 80,
        opacity: 0.18 + random() * 0.22,
        order: index,
    };
});

const PARTICLES = Array.from({length: 9}, () => ({
    left: random() * 100,
    size: 0.55 + random() * 0.5,
    duration: 14 + random() * 14,
    delay: -random() * 28,
}));

const WIND_STREAKS = Array.from({length: 6}, (_, index) => ({
    top: 10 + random() * 75,
    width: 120 + random() * 220,
    duration: index % 2 ? 2.6 : 1.9,
    delay: index % 2 ? -1.2 : 0,
}));

/** Mist banks per sky: always a little haze, thicker under cloud, rain and fog. */
const SMOKE_COUNT: Record<Scene["condition"], number> = {clear: 2, partlyCloudy: 4, cloudy: 6, fog: 7, drizzle: 6, rain: 6, snow: 5, thunder: 7};

const precipitationKind = (condition: Scene["condition"]): PrecipitationKind | null => {
    if (condition === CONDITION.SNOW) return "snow";
    if (condition === CONDITION.RAIN || condition === CONDITION.DRIZZLE || condition === CONDITION.THUNDER) return "rain";
    return null;
};

const SmokeShape = ({width}: {width: number}) => (
    <svg viewBox="0 0 300 120" width={width} height={width * 0.4} className="blur-[18px]" aria-hidden>
        <path d="M40 110h220a40 40 0 0 0 0-80 60 60 0 0 0-108-12 44 44 0 0 0-72 28A30 30 0 0 0 40 110z" fill="currentColor"/>
    </svg>
);

const SKY_FADE_MS = 1600;

type SkyLayerProps = {show: boolean; className?: string; hiddenClassName?: string; children?: ReactNode};

/**
 * A sky element that fades in when it appears, fades out when it goes, and is then removed from the page:
 * an invisible-but-mounted layer would keep animating and cost frames for nothing.
 */
const SkyLayer = ({show, className, hiddenClassName = "opacity-0", children}: SkyLayerProps) => {
    const isMounted = useLingering(show, SKY_FADE_MS);
    if (!isMounted) return null;
    return (
        <div className={cn("animate-[appear_var(--duration-sky)_var(--ease-out)] transition-[opacity,translate] duration-(--duration-sky) ease-(--ease-out)", className, !show && hiddenClassName)}>
            {children}
        </div>
    );
};

type SmokeProps = {bank: (typeof SMOKE)[number]; show: boolean; isWindy: boolean};

const Smoke = ({bank, show, isWindy}: SmokeProps) => {
    const isMounted = useLingering(show, SKY_FADE_MS);
    if (!isMounted) return null;
    return (
        <div
            className="sky-cloud"
            style={{top: `${bank.top}%`, "--duration": `${bank.duration / (isWindy ? 2.2 : 1)}s`, "--delay": `${bank.delay}s`, "--rest": `${bank.rest}vw`} as CSSProperties}
        >
            <div className="animate-[appear_var(--duration-sky)_var(--ease-out)] transition-opacity duration-(--duration-sky)" style={{opacity: show ? bank.opacity : 0}}>
                <SmokeShape width={bank.width}/>
            </div>
        </div>
    );
};

/** One drifting particle per season: frost dust, spring petals, summer light motes, autumn leaves. */
const SeasonParticle = ({season, particle}: {season: Season; particle: (typeof PARTICLES)[number]}) => {
    const isRising = season === "summer";
    return (
        <span
            className={cn("sky-particle", `sky-particle-${season}`, isRising ? "sky-particle-rise" : "sky-particle-fall")}
            style={{
                left: `${particle.left}%`,
                "--scale": particle.size,
                "--duration": `${particle.duration}s`,
                "--delay": `${particle.delay}s`,
            } as CSSProperties}
        />
    );
};

type SkyBackgroundProps = {scene: Scene};

/**
 * The night-glass backdrop: an almost black sky tinted by the weather, slow mist banks, a dark water floor, a faint
 * season glow and drifting season particles, plus rain/snow streaks, lightning and wind streaks. Decorative only.
 *
 * Built to stay cheap: two gradient layers at most, hidden pieces are unmounted after their fade, everything that
 * moves animates `transform`/`opacity` with fixed keyframes, so it all runs on the GPU (see `Precipitation`).
 */
export const SkyBackground = ({scene}: SkyBackgroundProps) => {
    const {condition, isDay, intensity, isWindy, season} = scene;
    const activeClass = skyClass(scene);
    const isClearish = condition === CONDITION.CLEAR || condition === CONDITION.PARTLY_CLOUDY;
    const smokeCount = SMOKE_COUNT[condition];
    const isStorm = condition === CONDITION.THUNDER;
    const lightningDelay = useTimelinePhase(LIGHTNING_PERIOD_S);

    // The previous gradient stays underneath while the new one fades in on top (state updated during render).
    const [layers, setLayers] = useState({current: activeClass, previous: activeClass});
    if (layers.current !== activeClass) setLayers({current: activeClass, previous: layers.current});

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
            <div className={cn("absolute inset-0", layers.previous)}/>
            <div key={layers.current} className={cn("absolute inset-0 animate-[fade-in_var(--duration-sky)_var(--ease-in-out)_both]", layers.current)}/>

            {/* Season glow: a faint warm or cool light from the upper right. */}
            <div className="absolute -top-1/4 -right-1/4 size-[80vmax] rounded-full bg-[radial-gradient(closest-side,rgb(var(--tint)/0.09),transparent)] transition-colors duration-(--duration-sky)"/>

            <SkyLayer show={!isDay} className={cn("absolute inset-0", isClearish ? "opacity-100" : "opacity-30")}>
                {STARS.map((star, index) => (
                    <span
                        key={index}
                        className="sky-star"
                        style={{left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, "--duration": `${star.duration}s`, "--delay": `${star.delay}s`} as CSSProperties}
                    />
                ))}
            </SkyLayer>

            {/* Mist: grey smoke banks drifting slowly across. */}
            <div className="absolute inset-0 text-[rgb(70_77_90)]">
                {SMOKE.map((bank) => <Smoke key={bank.order} bank={bank} show={bank.order < smokeCount} isWindy={isWindy}/>)}
            </div>

            <SkyLayer show={condition === CONDITION.FOG} className="absolute inset-x-[-20%] bottom-0 h-2/3">
                <div className="sky-fog absolute inset-x-0 bottom-[10%] h-1/2 rounded-[50%] bg-white/10 blur-3xl"/>
                <div className="sky-fog absolute inset-x-[10%] bottom-[35%] h-1/3 rounded-[50%] bg-white/8 blur-3xl [--duration:22s]"/>
            </SkyLayer>

            <div key={season} className="absolute inset-0 animate-fade-in">
                {PARTICLES.map((particle, index) => <SeasonParticle key={index} season={season} particle={particle}/>)}
            </div>

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

            <SkyLayer show={precipitationKind(condition) !== null} className="absolute inset-0 opacity-60">
                <Precipitation kind={precipitationKind(condition)} intensity={condition === CONDITION.DRIZZLE ? 1 : Math.max(intensity, 1) as Scene["intensity"]} isStorm={isStorm}/>
            </SkyLayer>

            {isStorm && (
                <>
                    {/* The near strike flashes with the hero's bolt; a fainter, slower one rumbles further away. */}
                    <div className="sky-lightning absolute inset-0 bg-[rgb(205_220_255/0.16)]" style={{"--delay": lightningDelay} as CSSProperties}/>
                    <div className="sky-lightning absolute inset-0 bg-[rgb(205_220_255/0.08)] [--delay:-4.3s] [--duration:13s]"/>
                </>
            )}

            {/* Dark water floor with a soft tinted reflection, like a lake at night. */}
            <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-black/70 via-black/35 to-transparent"/>
            <div className="absolute inset-x-[15%] bottom-[-8vh] h-[18vh] rounded-[50%] bg-[radial-gradient(closest-side,rgb(var(--tint)/0.08),transparent)] blur-xl"/>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_40%,rgb(0_0_0/0.55)_100%)]"/>
        </div>
    );
};
