export type Point = {x: number; y: number};

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * A smooth curve through every point (Catmull-Rom converted to cubic Béziers). The control points are clamped to the
 * vertical range of their segment, so the line never bulges past a real value.
 */
export const smoothPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M${round(points[0].x)},${round(points[0].y)}`;

    let path = `M${round(points[0].x)},${round(points[0].y)}`;
    for (let index = 0; index < points.length - 1; index++) {
        const previous = points[index - 1] ?? points[index];
        const current = points[index];
        const next = points[index + 1];
        const after = points[index + 2] ?? next;
        const low = Math.min(current.y, next.y);
        const high = Math.max(current.y, next.y);
        const clampY = (y: number) => Math.min(high, Math.max(low, y));

        const c1x = current.x + (next.x - previous.x) / 6;
        const c1y = clampY(current.y + (next.y - previous.y) / 6);
        const c2x = next.x - (after.x - current.x) / 6;
        const c2y = clampY(next.y - (after.y - current.y) / 6);
        path += ` C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(next.x)},${round(next.y)}`;
    }
    return path;
};

/** The same curve closed down to a baseline, for the gradient fill under the line. */
export const areaPath = (points: Point[], baseline: number): string => {
    if (points.length < 2) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${smoothPath(points)} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;
};

/** Maps a value onto a pixel range, top = max. Flat data sits in the middle instead of dividing by zero. */
export const scaleY = (value: number, min: number, max: number, top: number, bottom: number): number => {
    if (max === min) return (top + bottom) / 2;
    return bottom - ((value - min) / (max - min)) * (bottom - top);
};

/**
 * Round axis values covering [min, max] with about `count` steps (1, 2, 2.5 or 5 times a power of ten), so a chart's
 * gridlines fall on numbers people read at a glance.
 */
export const niceTicks = (min: number, max: number, count = 4): number[] => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
    if (max === min) {
        max += 1;
        min -= 1;
    }
    const rough = (max - min) / count;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ?? 10 * power;
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let value = start; value <= end + step / 2; value += step) ticks.push(Math.round(value * 1000) / 1000);
    return ticks;
};
