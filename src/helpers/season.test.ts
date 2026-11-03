import {isSeason, seasonFor} from "@/helpers/season";

const at = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day, 12) / 1000;

describe("seasonFor", () => {
    it("uses whole meteorological months in the north", () => {
        expect(seasonFor(at(2026, 1, 15), "Asia/Baku", 40.4)).toBe("winter");
        expect(seasonFor(at(2026, 4, 15), "Asia/Baku", 40.4)).toBe("spring");
        expect(seasonFor(at(2026, 7, 15), "Asia/Baku", 40.4)).toBe("summer");
        expect(seasonFor(at(2026, 10, 30), "Asia/Baku", 40.4)).toBe("autumn");
        expect(seasonFor(at(2026, 12, 1), "Asia/Baku", 40.4)).toBe("winter");
    });

    it("flips the season south of the equator", () => {
        expect(seasonFor(at(2026, 1, 15), "Australia/Sydney", -33.9)).toBe("summer");
        expect(seasonFor(at(2026, 10, 30), "Australia/Sydney", -33.9)).toBe("spring");
    });

    it("reads the month in the place's own time zone", () => {
        // 30 Nov 23:30 UTC is already 1 December in Tokyo.
        expect(seasonFor(Date.UTC(2026, 10, 30, 23, 30) / 1000, "Asia/Tokyo", 35.7)).toBe("winter");
        expect(seasonFor(Date.UTC(2026, 10, 30, 23, 30) / 1000, "Europe/London", 51.5)).toBe("autumn");
    });
});

describe("isSeason", () => {
    it("accepts only known seasons", () => {
        expect(isSeason("summer")).toBe(true);
        expect(isSeason("monsoon")).toBe(false);
        expect(isSeason(null)).toBe(false);
    });
});
