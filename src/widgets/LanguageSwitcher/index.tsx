import {Languages} from "lucide-react";
import {useTranslation} from "react-i18next";
import {LANGUAGE_LABELS, SUPPORTED_LANGUAGES, toLanguage} from "@/i18n/resources";
import {useLanguage} from "@/hooks/useLanguage";
import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

export const LanguageSwitcher = () => {
    const {t} = useTranslation();
    const {language, changeLanguage} = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="glass" size="md" aria-label={t("language")} className="px-3">
                    <Languages/>
                    <span className="text-xs font-semibold uppercase">{language}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => changeLanguage(toLanguage(value))}>
                    {SUPPORTED_LANGUAGES.map((code) => (
                        <DropdownMenuRadioItem key={code} value={code}>
                            <span className="w-6 text-xs font-semibold text-muted-foreground uppercase">{code}</span>
                            {LANGUAGE_LABELS[code]}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
