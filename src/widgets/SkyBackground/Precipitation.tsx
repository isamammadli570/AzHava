import type {Intensity} from "@/helpers/weather";

export type PrecipitationKind = "rain" | "snow";

/** Deterministic pseudo-random numbers, so streaks sit in the same place on every render. */
const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const random = seeded(11);
// Every element starts somewhere above the screen (top) and travels past the bottom. Variety comes from these start
// positions, not from per-element timing: see `.sky-rain` / `.sky-snow` in index.css for why.
const DROPS = Array.from({length: 40}, () => ({left: random() * 115 - 5, top: -30 - random() * 100, length: 9 + random() * 9}));
const FLAKES = Array.from({length: 36}, () => ({left: random() * 105, top: -random() * 100, size: 1.5 + random() * 2.5}));

const COUNT: Record<PrecipitationKind, readonly number[]> = {rain: [0, 16, 26, 40], snow: [0, 16, 26, 36]};

type PrecipitationProps = {kind: PrecipitationKind | null; intensity: Intensity; isStorm: boolean};

/** Background rain or snow as plain elements moved with CSS transforms, entirely on the GPU. */
export const Precipitation = ({kind, intensity, isStorm}: PrecipitationProps) => {
    if (!kind || intensity === 0) return null;
    const count = COUNT[kind][intensity];

    if (kind === "snow") {
        return (
            <div className="absolute inset-0">
                {FLAKES.slice(0, count).map((flake, index) => (
                    <span key={index} className="sky-snow" style={{left: `${flake.left}%`, top: `${flake.top}vh`, width: flake.size, height: flake.size}}/>
                ))}
            </div>
        );
    }

    return (
        <div className={isStorm ? "absolute inset-0 rotate-[16deg] scale-125" : "absolute inset-0 rotate-[9deg] scale-115"}>
            {DROPS.slice(0, count).map((drop, index) => (
                <span key={index} className="sky-rain" style={{left: `${drop.left}%`, top: `${drop.top}vh`, height: `${drop.length}vh`}}/>
            ))}
        </div>
    );
};
