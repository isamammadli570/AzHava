import type {CurrentWeather} from "@/api/forecast.api";
import {ADVICE, buildAdvice, compareWithYesterday} from "@/helpers/advice";
import type {DailyPoint, HourlyPoint} from "@/helpers/forecast";

const current = (overrides: Partial<CurrentWeather> = {}): CurrentWeather => ({
    time: 0,
    temperature_2m: 22,
    relative_humidity_2m: 50,
    apparent_temperature: 22,
    is_day: 1,
    precipitation: 0,
    weather_code: 0,
    cloud_cover: 0,
    pressure_msl: 1013,
    wind_speed_10m: 10,
    wind_direction_10m: 0,
    wind_gusts_10m: 15,
    uv_index: 3,
    visibility: 30_000,
    dew_point_2m: 10,
    ...overrides,
});

const today = {min: 15, max: 25, uvMax: 4} as DailyPoint;
const hour = (overrides: Partial<HourlyPoint> = {}) => ({weatherCode: 0, precipitationProbability: 0, ...overrides}) as HourlyPoint;

describe("buildAdvice", () => {
    it("calls a calm warm day a nice day", () => {
        expect(buildAdvice({current: current(), today, hours: [hour()], aqi: 20}).map((item) => item.id)).toEqual([ADVICE.NICE_DAY]);
    });

    it("puts storms and rain first and caps the list", () => {
        const ids = buildAdvice({
            current: current({weather_code: 95, apparent_temperature: 3, wind_gusts_10m: 60}),
            today: {...today, uvMax: 8, min: -1},
            hours: [hour({weatherCode: 95, precipitationProbability: 90})],
            aqi: 90,
        }).map((item) => item.id);
        expect(ids[0]).toBe(ADVICE.STORM);
        expect(ids[1]).toBe(ADVICE.UMBRELLA);
        expect(ids).toHaveLength(4);
    });

    it("suggests a jacket on a cool day", () => {
        expect(buildAdvice({current: current({apparent_temperature: 11}), today, hours: [hour()], aqi: null}).map((item) => item.id)).toEqual([ADVICE.JACKET]);
    });
});

describe("compareWithYesterday", () => {
    it("ignores tiny differences", () => {
        expect(compareWithYesterday(15.3, 15)).toEqual({trend: "same", delta: 0});
        expect(compareWithYesterday(18, 15)).toEqual({trend: "warmer", delta: 3});
        expect(compareWithYesterday(12, 15.4)).toEqual({trend: "colder", delta: 3});
    });
});
