import {areaPath, niceTicks, scaleY, smoothPath} from "@/helpers/chart";

describe("smoothPath", () => {
    it("handles empty and single-point input", () => {
        expect(smoothPath([])).toBe("");
        expect(smoothPath([{x: 1, y: 2}])).toBe("M1,2");
    });

    it("draws one cubic segment per gap and keeps control points inside the segment", () => {
        const path = smoothPath([{x: 0, y: 10}, {x: 10, y: 0}, {x: 20, y: 10}]);
        expect(path.match(/C/g)).toHaveLength(2);
        const ys = [...path.matchAll(/,(-?\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...ys)).toBeLessThanOrEqual(10);
    });
});

describe("areaPath", () => {
    it("closes down to the baseline", () => {
        expect(areaPath([{x: 0, y: 5}, {x: 10, y: 3}], 20)).toMatch(/L10,20 L0,20 Z$/);
    });
});

describe("scaleY", () => {
    it("puts max at the top and flat data in the middle", () => {
        expect(scaleY(10, 0, 10, 0, 100)).toBe(0);
        expect(scaleY(0, 0, 10, 0, 100)).toBe(100);
        expect(scaleY(5, 5, 5, 0, 100)).toBe(50);
    });
});

describe("niceTicks", () => {
    it("covers the range with round steps", () => {
        expect(niceTicks(3, 17)).toEqual([0, 5, 10, 15, 20]);
        expect(niceTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
    });

    it("widens a flat range", () => {
        const ticks = niceTicks(1013, 1013);
        expect(ticks[0]).toBeLessThan(1013);
        expect(ticks[ticks.length - 1]).toBeGreaterThan(1013);
    });
});
