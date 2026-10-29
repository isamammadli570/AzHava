import {useCallback, useMemo} from "react";
import {useTranslation} from "react-i18next";
import type {Place} from "@/helpers/place";
import {useLanguage} from "@/hooks/useLanguage";

/**
 * Display name and country for a place: built-in cities are translated, searched places keep their own name.
 * Countries of built-in cities come from our own translations; any other country falls back to `Intl.DisplayNames`.
 */
export const usePlaceLabel = () => {
    const {t, i18n} = useTranslation("cities");
    const {locale} = useLanguage();
    const regions = useMemo(() => new Intl.DisplayNames([locale], {type: "region"}), [locale]);

    const placeName = useCallback((place: Place): string => (place.cityId ? t(place.cityId) : place.name), [t]);

    const countryName = useCallback(
        (place: Place): string | undefined => {
            const code = place.countryCode;
            if (!code) return undefined;
            if (i18n.exists(`cities:countries.${code}`)) return t(`countries.${code}`);
            try {
                return regions.of(code);
            } catch {
                return code;
            }
        },
        [regions, t, i18n],
    );

    return {placeName, countryName};
};
