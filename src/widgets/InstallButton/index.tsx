import {Download, Share, SquarePlus} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useInstallPrompt} from "@/hooks/useInstallPrompt";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

/** "Install the app" in the header: one tap where the browser supports it, the manual steps on iPhone. */
export const InstallButton = () => {
    const {t} = useTranslation();
    const {canPrompt, needsIosSteps, install} = useInstallPrompt();

    if (canPrompt) {
        return (
            <Button variant="brand" size="md" onClick={() => void install()} aria-label={t("install.button")} className="px-3 sm:px-4">
                <Download/>
                <span className="hidden sm:inline">{t("install.button")}</span>
            </Button>
        );
    }

    if (!needsIosSteps) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="brand" size="icon" aria-label={t("install.button")}>
                    <Download/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
                <p className="mb-2 font-semibold">{t("install.iosTitle")}</p>
                <ol className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Share className="size-4 shrink-0 text-accent"/>
                        {t("install.iosStep1")}
                    </li>
                    <li className="flex items-center gap-2">
                        <SquarePlus className="size-4 shrink-0 text-accent"/>
                        {t("install.iosStep2")}
                    </li>
                </ol>
            </PopoverContent>
        </Popover>
    );
};
