import {clamp} from "@/helpers/format";

type Stop = [temperature: number, rgb: [number, number, number]];

/** Indigo and cyan for frost, a soft green for mild days, then yellow, orange and red: calm tones for slate glass. */
const TEMPERATURE_STOPS: Stop[] = [
    [-20, [125, 122, 255]],
    [-5, [100, 210, 255]],
    [5, [118, 214, 196]],
    [13, [158, 214, 140]],
    [20, [245, 214, 82]],
    [28, [255, 159, 10]],
    [38, [255, 69, 58]],
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
