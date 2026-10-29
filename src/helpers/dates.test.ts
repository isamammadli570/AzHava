import {formatClock, formatDayMonth, localDateKey} from "@/helpers/dates";

// 2026-10-28 22:30 UTC = 29 Oct 02:30 in Baku (UTC+4).
const MOMENT = Date.UTC(2026, 9, 28, 22, 30) / 1000;

describe("dates", () => {
    it("formats in the place's own time zone", () => {
        expect(formatClock(MOMENT, "Asia/Baku", "en-GB")).toBe("02:30");
        expect(formatClock(MOMENT, "Europe/London", "en-GB")).toBe("22:30");
    });

    it("finds the local calendar day", () => {
        expect(localDateKey(MOMENT, "Asia/Baku")).toBe("2026-10-29");
        expect(localDateKey(MOMENT, "America/New_York")).toBe("2026-10-28");
    });

    it("formats day and month", () => {
        expect(formatDayMonth(MOMENT, "Asia/Baku", "en-GB")).toBe("29 Oct");
    });
});
