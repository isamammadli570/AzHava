export const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
export type Season = (typeof SEASONS)[number];

const MONTH_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

/** Month (1–12) of a moment in the place's own time zone. */
const localMonth = (unixSeconds: number, timeZone: string): number => {
    let formatter = MONTH_FORMATTERS.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {month: "numeric", timeZone});
        MONTH_FORMATTERS.set(timeZone, formatter);
    }
    return Number(formatter.format(new Date(unixSeconds * 1000)));
};

/**
 * Meteorological season of a place: whole months (Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn),
 * flipped south of the equator, where December is summer.
 */
export const seasonFor = (unixSeconds: number, timeZone: string, latitude: number): Season => {
    const month = localMonth(unixSeconds, timeZone);
    const northern: Season = month === 12 || month <= 2 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
    if (latitude >= 0) return northern;
    const flip: Record<Season, Season> = {winter: "summer", spring: "autumn", summer: "winter", autumn: "spring"};
    return flip[northern];
};

export const isSeason = (value: unknown): value is Season => typeof value === "string" && (SEASONS as readonly string[]).includes(value);
