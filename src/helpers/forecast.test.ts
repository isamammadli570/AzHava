import type {HourlySeries} from "@/api/forecast.api";
import {nextPrecipitation, splitYesterday, temperatureBounds, toHourly, type DailyPoint} from "@/helpers/forecast";

const hourly: HourlySeries = {
    time: [0, 3600, 7200, 10_800],
    temperature_2m: [10, 11, 12, 13],
    apparent_temperature: [9, 10, 11, 12],
    precipitation_probability: [0, null, 70, 20],
    precipitation: [0, 0, 1.2, 0],
    weather_code: [0, 2, 61, 3],
    is_day: [0, 1, 1, 1],
    wind_speed_10m: [5, 6, 7, 8],
};

describe("toHourly", () => {
    it("starts at the hour containing now and fills missing probabilities", () => {
        const points = toHourly(hourly, 3600 + 1200);
        expect(points.map((point) => point.time)).toEqual([3600, 7200, 10_800]);
        expect(points[0].precipitationProbability).toBe(0);
        expect(points[0].isDay).toBe(true);
    });
});

describe("nextPrecipitation", () => {
    it("finds the first likely wet hour inside the window", () => {
        const points = toHourly(hourly, 0);
        expect(nextPrecipitation(points)?.time).toBe(7200);
        expect(nextPrecipitation(points, 2)).toBeNull();
    });
});

describe("splitYesterday", () => {
    it("separates the day before today", () => {
        const days = [{time: 1}, {time: 2}, {time: 3}] as DailyPoint[];
        const keyOf = (time: number) => `2026-10-0${time}`;
        const {yesterday, days: rest} = splitYesterday(days, keyOf, "2026-10-02");
        expect(yesterday?.time).toBe(1);
        expect(rest.map((day) => day.time)).toEqual([2, 3]);
    });
});

describe("temperatureBounds", () => {
    it("spans every day", () => {
        const days = [{min: 4, max: 12}, {min: -2, max: 9}, {min: 1, max: 15}] as DailyPoint[];
        expect(temperatureBounds(days)).toEqual({min: -2, max: 15});
        expect(temperatureBounds([])).toEqual({min: 0, max: 0});
    });
});
