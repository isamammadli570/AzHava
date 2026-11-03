import {daysUntilFullMoon, findNewAndFull, litMoonPath, moonInfo, moonPhaseName, moonView, nextMoonrise} from "@/helpers/moon";

describe("moonPhaseName", () => {
    it("rounds to the nearest of eight phases", () => {
        expect(moonPhaseName(0)).toBe("new");
        expect(moonPhaseName(0.99)).toBe("new");
        expect(moonPhaseName(0.25)).toBe("firstQuarter");
        expect(moonPhaseName(0.5)).toBe("full");
        expect(moonPhaseName(0.62)).toBe("waningGibbous");
        expect(moonPhaseName(0.8)).toBe("lastQuarter");
    });
});

describe("daysUntilFullMoon", () => {
    it("counts forward through the cycle", () => {
        expect(daysUntilFullMoon(0.5)).toBe(0);
        expect(daysUntilFullMoon(0.25)).toBe(7);
        expect(daysUntilFullMoon(0.6)).toBe(27);
    });
});

describe("moonInfo", () => {
    it("returns a full-ish moon in a known full-moon night", () => {
        // 2026-10-26 was a full moon; Baku, UTC+4.
        const info = moonInfo(Date.UTC(2026, 9, 26, 20) / 1000, 40.41, 49.87, 4 * 3600);
        expect(info.illumination).toBeGreaterThan(0.97);
        expect(["full", "waxingGibbous", "waningGibbous"]).toContain(info.name);
    });
});

describe("litMoonPath", () => {
    it("draws the right half at first quarter", () => {
        expect(litMoonPath(0.25, 50, 40)).toMatch(/^M50 10 A40 40 0 0 1 50 90 A0 40/);
    });
});

describe("findNewAndFull", () => {
    it("picks the days closest to new and full moon", () => {
        const phases = [0.9, 0.97, 0.005, 0.04, 0.3, 0.47, 0.499, 0.53];
        expect(findNewAndFull(phases)).toEqual({newMoon: 2, fullMoon: 6});
    });

    it("returns null when a phase is never reached", () => {
        expect(findNewAndFull([0.1, 0.2, 0.3])).toEqual({newMoon: null, fullMoon: null});
    });
});

describe("nextMoonrise", () => {
    it("finds a moonrise after the given moment, within a few days", () => {
        const now = Date.UTC(2026, 10, 3, 12) / 1000;
        const rise = nextMoonrise(now, 40.4, 49.9);
        expect(rise).not.toBeNull();
        expect(rise! - now).toBeGreaterThan(0);
        expect(rise! - now).toBeLessThan(2 * 86_400);
    });
});

describe("moonView", () => {
    const length = (vector: number[]) => Math.hypot(...vector);

    it("lights the moon from the front at full moon and from the side at a quarter", () => {
        // Full moon of 24 Nov 2026 and last quarter of 1 Nov 2026 (UTC).
        const full = moonView(Date.UTC(2026, 10, 24, 15) / 1000);
        expect(full.light[2]).toBeGreaterThan(0.95);
        const quarter = moonView(Date.UTC(2026, 10, 1, 20) / 1000);
        expect(Math.abs(quarter.light[2])).toBeLessThan(0.2);
        expect(length(quarter.light)).toBeCloseTo(1);
    });

    it("keeps libration within a few degrees", () => {
        const view = moonView(Date.UTC(2026, 10, 3) / 1000);
        view.libration.forEach((value) => expect(Math.abs(value)).toBeLessThan(0.13));
    });
});

    it("turns smoothly hour by hour, with no jumps in the light direction", () => {
        const start = Date.UTC(2026, 10, 1) / 1000;
        for (let hour = 0; hour < 72; hour++) {
            const a = moonView(start + hour * 3600).light;
            const b = moonView(start + (hour + 1) * 3600).light;
            expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.05);
        }
    });
