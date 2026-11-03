import type {HourlyPoint} from "@/helpers/forecast";
import {conditionFromCode, type Condition} from "@/helpers/weather";

/** Fewer hours than this left before midnight, and the summary looks at the next few hours instead. */
const MIN_HOURS = 4;

/**
 * The condition that fills most of the rest of the local day (ties go to the earlier hour), for the one-line
 * "rest of the day" summary above the hourly strip.
 */
export const dominantCondition = (hours: HourlyPoint[], dayKeyOf: (time: number) => string): Condition | null => {
    if (hours.length === 0) return null;
    const today = dayKeyOf(hours[0].time);
    const sameDay = hours.filter((hour) => dayKeyOf(hour.time) === today);
    const window = sameDay.length >= MIN_HOURS ? sameDay : hours.slice(0, MIN_HOURS);

    const counts = new Map<Condition, number>();
    for (const hour of window) {
        const condition = conditionFromCode(hour.weatherCode);
        counts.set(condition, (counts.get(condition) ?? 0) + 1);
    }
    let best: Condition | null = null;
    let bestCount = 0;
    for (const [condition, count] of counts) {
        if (count > bestCount) {
            best = condition;
            bestCount = count;
        }
    }
    return best;
};

/** Gusts worth mentioning in the summary, in km/h. */
export const NOTABLE_GUST_KMH = 20;
