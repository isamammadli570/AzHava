import {useTranslation} from "react-i18next";
import {INTL_LOCALES, toLanguage, type Language} from "@/i18n/resources";

/** The active UI language plus the matching `Intl` locale for dates and country names. */
export const useLanguage = () => {
    const {i18n} = useTranslation();
    const language = toLanguage(i18n.resolvedLanguage ?? i18n.language);

    return {
        language,
        locale: INTL_LOCALES[language],
        changeLanguage: (next: Language) => void i18n.changeLanguage(next),
    };
};
