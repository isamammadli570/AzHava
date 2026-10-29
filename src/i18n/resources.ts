import azCommon from "./locales/AZ/common.json";
import azWeather from "./locales/AZ/weather.json";
import azCities from "./locales/AZ/cities.json";
import enCommon from "./locales/EN/common.json";
import enWeather from "./locales/EN/weather.json";
import enCities from "./locales/EN/cities.json";
import ruCommon from "./locales/RU/common.json";
import ruWeather from "./locales/RU/weather.json";
import ruCities from "./locales/RU/cities.json";

export const SUPPORTED_LANGUAGES = ["az", "en", "ru"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = ["common", "weather", "cities"] as const;

export const LANGUAGE_LABELS: Record<Language, string> = {az: "Azərbaycan", en: "English", ru: "Русский"};

/** BCP 47 tags handed to `Intl`; en-GB keeps a 24-hour clock and day-month order like the other two. */
export const INTL_LOCALES: Record<Language, string> = {az: "az-Latn-AZ", en: "en-GB", ru: "ru-RU"};

export const toLanguage = (value: string | undefined): Language => {
    const base = value?.split("-")[0];
    return SUPPORTED_LANGUAGES.find((language) => language === base) ?? "az";
};

export const RESOURCES = {
    az: {common: azCommon, weather: azWeather, cities: azCities},
    en: {common: enCommon, weather: enWeather, cities: enCities},
    ru: {common: ruCommon, weather: ruWeather, cities: ruCities},
} as const;
