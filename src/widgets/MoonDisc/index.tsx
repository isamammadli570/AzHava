import {useId} from "react";
import {litMoonPath} from "@/helpers/moon";
import {cn} from "@/lib/utils";

const CRATERS = [
    {cx: 38, cy: 34, r: 7},
    {cx: 60, cy: 28, r: 4},
    {cx: 64, cy: 56, r: 9},
    {cx: 42, cy: 62, r: 5},
    {cx: 30, cy: 50, r: 3.5},
    {cx: 52, cy: 44, r: 3},
    {cx: 70, cy: 40, r: 2.5},
];

type MoonDiscProps = {phase: number; className?: string};

/** The moon at its current phase: a dim full disc, the lit part on top, craters only on the lit part. */
export const MoonDisc = ({phase, className}: MoonDiscProps) => {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const lit = litMoonPath(phase, 50, 42);

    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0 drop-shadow-[0_0_24px_rgb(220_228_255/0.25)]", className)} aria-hidden>
            <defs>
                <radialGradient id={`${uid}-lit`} cx="40%" cy="38%" r="70%">
                    <stop offset="0" stopColor="#f4f4f0"/>
                    <stop offset=".65" stopColor="#c9ccd3"/>
                    <stop offset="1" stopColor="#9a9fab"/>
                </radialGradient>
                <clipPath id={`${uid}-clip`}>
                    <path d={lit}/>
                </clipPath>
            </defs>
            <circle cx="50" cy="50" r="42" fill="#2a3140" opacity=".85"/>
            <path d={lit} fill={`url(#${uid}-lit)`}/>
            <g clipPath={`url(#${uid}-clip)`} fill="#7f8592" opacity=".35">
                {CRATERS.map((crater) => <circle key={`${crater.cx}-${crater.cy}`} {...crater}/>)}
            </g>
        </svg>
    );
};
