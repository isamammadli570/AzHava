import {describe, expect, it} from "vitest";
import {beaufortForce, beaufortRange, peakOf, sumOf, trendOf, type DetailHour} from "@/helpers/detail";

const hour = (time: number, temperature: number, precipitation = 0): DetailHour => ({
    time,
    temperature,
    apparentTemperature: temperature,
    precipitationProbability: 0,
    precipitation,
    weatherCode: 0,
    isDay: true,
    windSpeed: 0,
    windGusts: 0,
    windDirection: 0,
    uv: 0,
    humidity: 50,
    dewPoint: 5,
    visibility: 20,
    pressure: 1013,
});

describe("peakOf", () => {
    const hours = [hour(1, 8), hour(2, 12), hour(3, 12), hour(4, 5)];

    it("finds the highest reading, earliest on a tie", () => {
        expect(peakOf(hours, (item) => item.temperature)).toEqual({time: 2, value: 12});
    });

    it("finds the lowest reading", () => {
        expect(peakOf(hours, (item) => item.temperature, true)).toEqual({time: 4, value: 5});
    });

    it("returns null for no hours", () => {
        expect(peakOf([], (item) => item.temperature)).toBeNull();
    });
});

describe("sumOf", () => {
    it("adds up the readings", () => {
        expect(sumOf([hour(1, 0, 0.4), hour(2, 0, 1.1)], (item) => item.precipitation)).toBeCloseTo(1.5);
    });
});

describe("trendOf", () => {
    it("tells rising, falling and steady apart", () => {
        expect(trendOf(1010, 1015, 2)).toBe("rising");
        expect(trendOf(1015, 1010, 2)).toBe("falling");
        expect(trendOf(1010, 1011, 2)).toBe("steady");
    });
});

describe("beaufort", () => {
    it("maps km/h onto forces", () => {
        expect(beaufortForce(0)).toBe(0);
        expect(beaufortForce(5)).toBe(1);
        expect(beaufortForce(28)).toBe(4);
        expect(beaufortForce(130)).toBe(12);
    });

    it("prints each force's range", () => {
        expect(beaufortRange(0)).toBe("< 1");
        expect(beaufortRange(1)).toBe("1–5");
        expect(beaufortRange(12)).toBe("≥ 118");
    });
});
