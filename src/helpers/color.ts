import {clamp} from "@/helpers/format";

type Stop = [temperature: number, rgb: [number, number, number]];

/** Cold violet-blue through teal and green to amber and red; tuned to read on a dark glass card. */
const TEMPERATURE_STOPS: Stop[] = [
    [-20, [139, 152, 255]],
    [-5, [96, 165, 250]],
    [5, [94, 234, 212]],
    [14, [163, 230, 53]],
    [22, [250, 204, 21]],
    [30, [251, 146, 60]],
    [40, [239, 68, 68]],
];

export const temperatureColor = (temperature: number): string => {
    const value = clamp(temperature, TEMPERATURE_STOPS[0][0], TEMPERATURE_STOPS[TEMPERATURE_STOPS.length - 1][0]);
    const upperIndex = TEMPERATURE_STOPS.findIndex(([stop]) => stop >= value);
    if (upperIndex <= 0) return `rgb(${TEMPERATURE_STOPS[0][1].join(" ")})`;

    const [fromTemp, from] = TEMPERATURE_STOPS[upperIndex - 1];
    const [toTemp, to] = TEMPERATURE_STOPS[upperIndex];
    const ratio = (value - fromTemp) / (toTemp - fromTemp);
    const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * ratio));
    return `rgb(${mixed.join(" ")})`;
};

/** Gradient for a min→max range bar, with a middle stop so wide ranges pass through the right hues. */
export const temperatureGradient = (min: number, max: number): string =>
    `linear-gradient(90deg, ${temperatureColor(min)}, ${temperatureColor((min + max) / 2)}, ${temperatureColor(max)})`;
