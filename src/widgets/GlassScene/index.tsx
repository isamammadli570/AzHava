import {LIGHTNING_PERIOD_S} from "@/constants/other";
import {CONDITION, type Condition, type Intensity} from "@/helpers/weather";
import {useTimelinePhase} from "@/hooks/useTimelinePhase";
import {cn} from "@/lib/utils";
import {MoonDisc} from "@/widgets/MoonDisc";

/** Deterministic pseudo-random numbers, so the sculpture looks the same on every render. */
const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

/** Depth of a bubble: 0 sits at the back (dim), 2 at the front (the bright lowest row). */
type Depth = 0 | 1 | 2;
type Bubble = {left: number; top: number; size: number; depth: Depth};

/**
 * The cloud: a dense heap of overlapping glass spheres in three depths, positions and sizes in % of the scene width.
 * Big spheres make the body, a row of small ones the underside the rain hangs from.
 */
const CLOUD: Bubble[] = [
    {left: 18, top: 10, size: 22, depth: 0},
    {left: 38, top: 0, size: 26, depth: 0},
    {left: 58, top: 6, size: 22, depth: 0},
    {left: 72, top: 18, size: 18, depth: 0},
    {left: 7, top: 24, size: 16, depth: 0},
    {left: 47, top: -5, size: 13, depth: 0},
    {left: 2, top: 30, size: 20, depth: 1},
    {left: 16, top: 19, size: 26, depth: 1},
    {left: 33, top: 7, size: 30, depth: 1},
    {left: 55, top: 13, size: 28, depth: 1},
    {left: 74, top: 26, size: 22, depth: 1},
    {left: 86, top: 34, size: 14, depth: 1},
    {left: 28, top: 3, size: 11, depth: 1},
    {left: 6, top: 38, size: 14, depth: 2},
    {left: 16, top: 35, size: 19, depth: 2},
    {left: 30, top: 29, size: 23, depth: 2},
    {left: 46, top: 31, size: 21, depth: 2},
    {left: 61, top: 33, size: 18, depth: 2},
    {left: 74, top: 38, size: 14, depth: 2},
    {left: 85, top: 42, size: 10, depth: 2},
    {left: 92, top: 40, size: 8, depth: 2},
    {left: 0, top: 44, size: 9, depth: 2},
    {left: 25, top: 46, size: 10, depth: 2},
    {left: 39, top: 47, size: 11, depth: 2},
    {left: 53, top: 47, size: 10, depth: 2},
    {left: 67, top: 47, size: 9, depth: 2},
];

/** The cloud's underside in cqw (the cloud scales with the width), and the water line in cqh. */
const CLOUD_BASE = 50;
const WATER_LEVEL = 93;
/** How far a drop sheet travels (cqh): from the highest strand tip (just under the cloud) to the water. */
const DROP_FALL = 64;

const random = seeded(7);
/** Long in the middle, short at the edges: the rain hangs from the cloud like a glass curtain. */
const STRANDS = Array.from({length: 54}, (_, index) => {
    const left = 9 + (index / 53) * 82 + (random() - 0.5) * 2.5;
    const centrality = 1 - Math.abs(left - 50) / 45;
    return {left, length: 4 + random() * (10 + centrality * 44), opacity: 0.35 + random() * 0.65, hasBead: random() > 0.35};
});
// Moving parts share a few rhythms: each looping animation wakes the main thread once per loop, so per-element
// timings would cost a wake-up almost every frame.
const DROP_PHASES = [0, -0.4, -0.8, -1.2];
const GLINT_PHASES = [0, -0.8, -1.6];
const FLAKES = Array.from({length: 34}, () => ({left: 4 + random() * 92, size: 2 + random() * 4.5, rise: random() * 30}));
/** The snow sheets: three fall speeds, phases spread over the fall so the air is never empty. */
const SNOW_BEATS = Array.from({length: 6}, (_, sheet) => {
    const duration = [6, 7.5, 9][sheet % 3];
    return {duration, delay: -(sheet / 6) * duration};
});
/** How far a snow sheet travels (cqh): from the highest flake inside the cloud to the water. */
const SNOW_FALL = 90;
const SPARKS = Array.from({length: 9}, (_, index) => ({left: 2 + random() * 96, top: 2 + random() * 80, delay: index % 2 ? -1.75 : 0, size: 1.5 + random() * 2}));

/** How much of the curtain each intensity shows: drizzle is thin and short, a downpour dense. */
const STRAND_COUNT: Record<Intensity, number> = {0: 0, 1: 22, 2: 38, 3: 54};

/** Picks `count` strands spread evenly over the whole curtain, not just the left-most ones. */
const spreadStrands = (count: number) => STRANDS.filter((_, index) => Math.floor(((index + 1) * count) / STRANDS.length) > Math.floor((index * count) / STRANDS.length));

const isWetCondition = (condition: Condition) => condition === CONDITION.RAIN || condition === CONDITION.DRIZZLE || condition === CONDITION.THUNDER;

const DEPTH_CLASS: Record<Depth, string> = {0: "gs-bubble gs-bubble-back", 1: "gs-bubble", 2: "gs-bubble gs-bubble-front"};

const GlassCloud = ({className}: {className?: string}) => (
    <div className={cn("absolute inset-x-0 top-0 aspect-[1/0.6]", className)}>
        {/* Light caught inside the heap, behind the spheres. */}
        <span className="gs-core"/>
        {CLOUD.map((bubble) => (
            <span
                key={`${bubble.left}-${bubble.top}`}
                className={DEPTH_CLASS[bubble.depth]}
                // Positions are in % of the width; the box is 0.6 as tall as it is wide, so `top` is converted.
                style={{left: `${bubble.left}%`, top: `${bubble.top / 0.6}%`, width: `${bubble.size}%`}}
            />
        ))}
    </div>
);

type GlassSceneProps = {
    condition: Condition;
    isDay: boolean;
    intensity: Intensity;
    isWindy?: boolean;
    /** The moment shown (unix seconds): at night the real moon is drawn at its phase for that time. */
    time?: number;
    className?: string;
};

/**
 * The weather as a glass sculpture: a heap of glass spheres that hangs a curtain of glass threads into a lit pool,
 * sheds snow, flickers with lightning or sinks into fog; a glass sun or moon on clear days and nights. The glass
 * itself is cool and colourless; the season (`--tint`) only colours the light inside it and in the water.
 *
 * Only whole elements move (`transform`/`opacity`, on the GPU): the cloud and everything hanging from it float as one
 * layer, glints slide down the threads, beads swell and drop, rings spread; the threads themselves are still after
 * unrolling on arrival. Sized by its container (container query units).
 */
export const GlassScene = ({condition, isDay, intensity, isWindy = false, time, className}: GlassSceneProps) => {
    const isWet = isWetCondition(condition);
    const isDrizzle = condition === CONDITION.DRIZZLE;
    const strands = isWet ? spreadStrands(STRAND_COUNT[isDrizzle ? 1 : (Math.max(intensity, 1) as Intensity)]) : [];
    const strandScale = isDrizzle ? 0.55 : 1;
    const hasCloud = condition !== CONDITION.CLEAR;
    const hasOrb = condition === CONDITION.CLEAR || condition === CONDITION.PARTLY_CLOUDY;
    const isSnow = condition === CONDITION.SNOW;
    const isStorm = condition === CONDITION.THUNDER;
    const lightningDelay = useTimelinePhase(LIGHTNING_PERIOD_S);

    return (
        <div aria-hidden className={cn("glass-scene relative aspect-[1/1.7] [container-type:size]", className)}>
            {/* Clear sky: a glass sun (day) or moon (night); a small cloud drifts in front when it is partly cloudy. */}
            {hasOrb && (
                <div className={cn("gs-float absolute", condition === CONDITION.CLEAR ? "top-[12%] left-[16%] w-[70%]" : "top-[3%] left-[30%] w-[62%]")}>
                    <div className="gs-enter relative">
                        {isDay && <span className="gs-halo"/>}
                        {/* Stars sit behind the moon, so its dark side hides the ones it passes in front of. */}
                        {!isDay && SPARKS.map((spark) => (
                            <span
                                key={spark.left}
                                className="gs-spark"
                                style={{left: `${spark.left - 10}%`, top: `${spark.top}%`, width: spark.size, height: spark.size, animationDelay: `${spark.delay}s`}}
                            />
                        ))}
                        {isDay || time === undefined ? (
                            <span className={cn("gs-orb", isDay ? "gs-orb-sun" : "gs-orb-moon")}/>
                        ) : (
                            <span className="gs-moon-glow relative block">
                                <MoonDisc time={time} earthshine={0.04} className="w-full"/>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Everything that hangs from the cloud floats with it as one layer, so the threads never come loose. */}
            {hasCloud && (
                <div className={cn("gs-float absolute inset-0", isWindy && "gs-float-windy")}>
                    <div className="gs-enter absolute inset-0">
                        {/* Rain: still threads hanging from the cloud (drawn first, so the cloud covers their roots) that
                            grow out of it on arrival; glints slide down them and beads hang at their tips. */}
                        {strands.map((strand, index) => {
                            const length = strand.length * strandScale;
                            const tip = `${CLOUD_BASE}cqw + ${length}cqh`;
                            return (
                                <span key={strand.left} className="absolute top-0" style={{left: `${strand.left}%`}}>
                                    <span
                                        className="gs-strand"
                                        style={{
                                            top: `${CLOUD_BASE - 6}cqw`,
                                            height: `calc(6cqw + ${length}cqh)`,
                                            opacity: strand.opacity,
                                            // The curtain unrolls from the middle outwards.
                                            animationDelay: `${(0.3 + Math.abs(strand.left - 50) / 110).toFixed(2)}s`,
                                        }}
                                    />
                                    <span className="gs-hang">
                                        {index % 6 === 0 && (
                                            <span className="gs-glint" style={{top: `${CLOUD_BASE}cqw`, height: `${length}cqh`, animationDelay: `${GLINT_PHASES[(index / 6) % 3]}s`}}/>
                                        )}
                                        {(strand.hasBead || index % 2 === 0) && <span className="gs-bead" style={{top: `calc(${tip} - 3px)`}}/>}
                                    </span>
                                </span>
                            );
                        })}

                        {/* Falling drops, one moving sheet per beat instead of one animation per drop: every looping
                            animation costs the main thread a wake-up per loop. The sheet falls the longest way any drop
                            has; the clip at the water line swallows each drop as it reaches the surface, so all fall at
                            the same speed and the short ones simply land sooner. */}
                        {strands.length > 0 && (
                            <div className="gs-hang absolute inset-x-0 top-0 overflow-hidden" style={{height: `${WATER_LEVEL}cqh`}}>
                                {DROP_PHASES.map((phase, beat) => (
                                    <div key={beat} className="gs-drops" style={{height: `${DROP_FALL}cqh`, animationDelay: `${phase}s`}}>
                                        {strands.map((strand, index) => index % 8 === beat * 2 && (
                                            <span key={strand.left} className="gs-drop" style={{left: `${strand.left}%`, top: `calc(${CLOUD_BASE}cqw + ${strand.length * strandScale}cqh)`}}/>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Snow: six drifting sheets of flakes (one animation each, like the rain), clipped at the water.
                            The flakes start at different heights inside the cloud, which hides them until they drop out
                            of its underside, so they appear at scattered moments. */}
                        {isSnow && (
                            <div className="absolute inset-x-0 top-0 overflow-hidden" style={{height: `${WATER_LEVEL}cqh`}}>
                                {SNOW_BEATS.map((beat, sheet) => (
                                    <div
                                        key={sheet}
                                        className={cn("gs-flakes", sheet % 2 === 1 && "gs-flakes-right")}
                                        style={{height: `${SNOW_FALL}cqh`, animationDuration: `${beat.duration}s`, animationDelay: `${beat.delay}s`}}
                                    >
                                        {FLAKES.map((flake, index) => index % SNOW_BEATS.length === sheet && (
                                            <span
                                                key={index}
                                                className="gs-flake"
                                                style={{left: `${flake.left}%`, top: `${CLOUD_BASE - 8 - flake.rise}cqw`, width: flake.size, height: flake.size}}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={cn("absolute inset-x-0 top-[3%]", condition === CONDITION.FOG && "opacity-70", condition === CONDITION.PARTLY_CLOUDY && "top-[30%] left-[-8%] w-[74%]")}>
                            {condition === CONDITION.CLOUDY && <GlassCloud className="top-[-7%] left-[16%] w-[74%] scale-90 opacity-40"/>}
                            <GlassCloud/>
                            {isStorm && <span className="gs-flash" style={{animationDelay: lightningDelay}}/>}
                        </div>
                    </div>
                </div>
            )}

            {/* A thin bolt under the cloud, on the same beat as the glow inside it and the flash across the sky. */}
            {isStorm && (
                <span className="gs-bolt" style={{top: `${CLOUD_BASE + 5}cqw`, height: `calc(${WATER_LEVEL - 4}cqh - ${CLOUD_BASE + 5}cqw)`, animationDelay: lightningDelay}}>
                    <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="size-full">
                        <path d="M26 0 L15 36 L25 39 L11 70 L21 73 L8 100" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                    </svg>
                </span>
            )}

            {condition === CONDITION.FOG && (
                <>
                    <span className="gs-mist top-[20%]"/>
                    <span className="gs-mist top-[36%] [animation-delay:-5s]"/>
                    <span className="gs-mist top-[54%] [animation-delay:-9s]"/>
                    <span className="gs-mist top-[74%] [animation-delay:-3s]"/>
                </>
            )}

            {/* The water: a dark mirror with still ripples, a lit centre where the rain lands and rings spreading out
                (snow settles on it as a frosted glow instead). */}
            {(isWet || isSnow) && (
                <div className="absolute inset-x-[-18%]" style={{top: `${WATER_LEVEL - 5}cqh`, height: "11cqh"}}>
                    <span className={cn("gs-water", isSnow && "gs-water-frost")}/>
                    {isWet && [0, 1, 2, 3].map((ring) => <span key={ring} className="gs-ring" style={{animationDelay: `${ring * -0.7}s`}}/>)}
                </div>
            )}
        </div>
    );
};
