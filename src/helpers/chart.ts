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
