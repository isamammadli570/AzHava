import {aqiLevel, compassPoint, dayProgress, formatKm, formatTemp, pressureLevel, splitDuration, uvLevel} from "@/helpers/format";

describe("formatTemp", () => {
    it("rounds and never shows negative zero", () => {
        expect(formatTemp(12.6)).toBe("13°");
        expect(formatTemp(-0.4)).toBe("0°");
        expect(formatTemp(-3.5)).toBe("-3°");
        expect(formatTemp(null)).toBe("—");
    });
});

describe("compassPoint", () => {
    it("snaps degrees to the nearest of eight points", () => {
        expect(compassPoint(0)).toBe("N");
        expect(compassPoint(350)).toBe("N");
        expect(compassPoint(44)).toBe("NE");
        expect(compassPoint(180)).toBe("S");
        expect(compassPoint(-90)).toBe("W");
    });
});

describe("levels", () => {
    it("bands UV, AQI and pressure", () => {
        expect(uvLevel(2.9)).toBe("low");
        expect(uvLevel(7)).toBe("high");
        expect(uvLevel(11)).toBe("extreme");
        expect(aqiLevel(20)).toBe("good");
        expect(aqiLevel(55)).toBe("moderate");
        expect(aqiLevel(140)).toBe("extremelyPoor");
        expect(pressureLevel(1000)).toBe("low");
        expect(pressureLevel(1013)).toBe("normal");
        expect(pressureLevel(1030)).toBe("high");
    });
});

describe("dayProgress", () => {
    it("is clamped between sunrise and sunset", () => {
        expect(dayProgress(50, 100, 200)).toBe(0);
        expect(dayProgress(150, 100, 200)).toBe(0.5);
        expect(dayProgress(250, 100, 200)).toBe(1);
    });
});

describe("splitDuration", () => {
    it("never returns 60 minutes", () => {
        expect(splitDuration(3599.9)).toEqual({hours: 1, minutes: 0});
        expect(splitDuration(37_800)).toEqual({hours: 10, minutes: 30});
    });
});

describe("formatKm", () => {
    it("keeps one decimal only for short distances", () => {
        expect(formatKm(2450)).toBe("2.5");
        expect(formatKm(31_980)).toBe("32");
    });
});
