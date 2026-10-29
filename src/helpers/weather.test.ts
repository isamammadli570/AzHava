import {CONDITION, conditionFromCode, intensityFromCode, sceneFor, skyClass, weatherLabelKey} from "@/helpers/weather";

describe("conditionFromCode", () => {
    it.each([
        [0, CONDITION.CLEAR],
        [1, CONDITION.CLEAR],
        [2, CONDITION.PARTLY_CLOUDY],
        [3, CONDITION.CLOUDY],
        [45, CONDITION.FOG],
        [53, CONDITION.DRIZZLE],
        [63, CONDITION.RAIN],
        [81, CONDITION.RAIN],
        [75, CONDITION.SNOW],
        [86, CONDITION.SNOW],
        [95, CONDITION.THUNDER],
        [42, CONDITION.CLOUDY],
    ])("maps WMO %i to %s", (code, condition) => {
        expect(conditionFromCode(code)).toBe(condition);
    });
});

describe("intensityFromCode", () => {
    it("grades precipitation", () => {
        expect(intensityFromCode(0)).toBe(0);
        expect(intensityFromCode(61)).toBe(1);
        expect(intensityFromCode(63)).toBe(2);
        expect(intensityFromCode(65)).toBe(3);
        expect(intensityFromCode(99)).toBe(3);
    });
});

describe("skyClass", () => {
    it("joins variant and time of day, folding drizzle into rain", () => {
        expect(skyClass(sceneFor(0, true))).toBe("sky-clear-day");
        expect(skyClass(sceneFor(51, false))).toBe("sky-rain-night");
        expect(skyClass(sceneFor(96, true))).toBe("sky-thunder-day");
    });
});

describe("weatherLabelKey", () => {
    it("uses the code label when one exists and the condition otherwise", () => {
        expect(weatherLabelKey(61)).toBe("codes.61");
        expect(weatherLabelKey(42)).toBe("conditions.cloudy");
    });
});
