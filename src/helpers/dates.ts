const formatters = new Map<string, Intl.DateTimeFormat>();

/** `Intl.DateTimeFormat` is expensive to build; charts format hundreds of labels, so instances are cached. */
const formatter = (locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
    const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
    let instance = formatters.get(key);
    if (!instance) {
        instance = new Intl.DateTimeFormat(locale, {...options, timeZone});
        formatters.set(key, instance);
    }
    return instance;
};

const toDate = (unixSeconds: number): Date => new Date(unixSeconds * 1000);

type NameTable = {weekdays: string[]; weekdaysShort: string[]; months: string[]; monthsShort: string[]};

/** Sunday-first names, used when the browser's ICU lacks the locale's data (Electron and some trimmed builds). */
const NAME_TABLES: Record<string, NameTable> = {
    az: {
        weekdays: ["bazar", "bazar ertəsi", "çərşənbə axşamı", "çərşənbə", "cümə axşamı", "cümə", "şənbə"],
        weekdaysShort: ["Baz", "B.e.", "Ç.a.", "Çər", "C.a.", "Cüm", "Şən"],
        months: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
        monthsShort: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"],
    },
    ru: {
        weekdays: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
        weekdaysShort: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
        months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
        monthsShort: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
    },
};

const localeSupport = new Map<string, boolean>();

/**
 * True when Intl really knows the locale's month names. Trimmed ICU builds claim support but print "M01" or
 * English, so the check looks for the real January name instead of trusting `supportedLocalesOf`.
 */
const hasLocaleData = (locale: string, table: NameTable): boolean => {
    const cached = localeSupport.get(locale);
    if (cached !== undefined) return cached;
    const january = new Date(Date.UTC(2020, 0, 15));
    const printed = new Intl.DateTimeFormat(locale, {day: "numeric", month: "long", timeZone: "UTC"}).format(january).toLocaleLowerCase();
    const isSupported = printed.includes(table.months[0].slice(0, 3));
    localeSupport.set(locale, isSupported);
    return isSupported;
};

const fallbackTable = (locale: string): NameTable | null => {
    const table = NAME_TABLES[locale.split("-")[0]];
    return table && !hasLocaleData(locale, table) ? table : null;
};

const WEEKDAY_INDEX: Record<string, number> = {Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6};

/** Weekday, month and day of a moment in the place's time zone (English parts always exist). */
const zonedParts = (unixSeconds: number, timeZone: string) => {
    const parts = formatter("en-US", timeZone, {weekday: "short", month: "numeric", day: "numeric"}).formatToParts(toDate(unixSeconds));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
    return {weekday: WEEKDAY_INDEX[part("weekday")] ?? 0, month: Number(part("month")) - 1, day: Number(part("day"))};
};

export const formatClock = (unixSeconds: number, timeZone: string, locale: string): string =>
    formatter(locale, timeZone, {hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).format(toDate(unixSeconds));

export const formatWeekday = (unixSeconds: number, timeZone: string, locale: string, weekday: "long" | "short" = "long"): string => {
    const table = fallbackTable(locale);
    if (!table) return formatter(locale, timeZone, {weekday}).format(toDate(unixSeconds));
    const {weekday: index} = zonedParts(unixSeconds, timeZone);
    return weekday === "long" ? table.weekdays[index] : table.weekdaysShort[index];
};

export const formatDayMonth = (unixSeconds: number, timeZone: string, locale: string): string => {
    const table = fallbackTable(locale);
    if (!table) return formatter(locale, timeZone, {day: "numeric", month: "short"}).format(toDate(unixSeconds));
    const {day, month} = zonedParts(unixSeconds, timeZone);
    return `${day} ${table.monthsShort[month]}`;
};

export const formatFullDate = (unixSeconds: number, timeZone: string, locale: string): string => {
    const table = fallbackTable(locale);
    if (!table) return formatter(locale, timeZone, {weekday: "long", day: "numeric", month: "long"}).format(toDate(unixSeconds));
    const {weekday, day, month} = zonedParts(unixSeconds, timeZone);
    return `${table.weekdays[weekday]}, ${day} ${table.months[month]}`;
};

/** Calendar day (YYYY-MM-DD) of a moment as seen in the place's own time zone. */
export const localDateKey = (unixSeconds: number, timeZone: string): string =>
    formatter("en-CA", timeZone, {year: "numeric", month: "2-digit", day: "2-digit"}).format(toDate(unixSeconds));

export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
