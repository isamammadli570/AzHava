const LETTER_MAP: Record<string, string> = {"ə": "e", "ı": "i", "ş": "s", "ç": "c", "ğ": "g", "ö": "o", "ü": "u", "ё": "е"};

/** Lower-cases and folds Azerbaijani/Turkish letters and diacritics, so "Seki" finds "Şəki" and "gence" finds "Gəncə". */
export const normalizeSearch = (value: string): string =>
    value
        .trim()
        .toLocaleLowerCase("az")
        .replace(/[əışçğöüё]/g, (letter) => LETTER_MAP[letter] ?? letter)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ");

export const matchesSearch = (text: string, term: string): boolean => {
    const needle = normalizeSearch(term);
    return needle.length === 0 || normalizeSearch(text).includes(needle);
};
