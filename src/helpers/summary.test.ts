import type {HourlyPoint} from "@/helpers/forecast";
import {dominantCondition} from "@/helpers/summary";

const hour = (time: number, weatherCode: number) => ({time, weatherCode}) as HourlyPoint;
// Day key: every 10 units of time is a new day.
const dayKeyOf = (time: number) => String(Math.floor(time / 10));

describe("dominantCondition", () => {
    it("picks the most common condition for the rest of today", () => {
        const hours = [hour(1, 3), hour(2, 61), hour(3, 61), hour(4, 3), hour(5, 61), hour(11, 0), hour(12, 0), hour(13, 0)];
        expect(dominantCondition(hours, dayKeyOf)).toBe("rain");
    });

    it("looks ahead a few hours when the day is nearly over", () => {
        const hours = [hour(9, 3), hour(10, 0), hour(11, 0), hour(12, 0)];
        expect(dominantCondition(hours, dayKeyOf)).toBe("clear");
    });

    it("prefers the earlier condition on a tie and handles no data", () => {
        expect(dominantCondition([hour(1, 3), hour(2, 0), hour(3, 3), hour(4, 0)], dayKeyOf)).toBe("cloudy");
        expect(dominantCondition([], dayKeyOf)).toBeNull();
    });
});
