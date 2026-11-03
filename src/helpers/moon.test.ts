import {daysUntilFullMoon, findNewAndFull, litMoonPath, moonInfo, moonPhaseName} from "@/helpers/moon";

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
