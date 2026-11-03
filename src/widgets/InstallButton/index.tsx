import {Download, Share, SquarePlus} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useInstallPrompt} from "@/hooks/useInstallPrompt";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

const ICON_BUTTON =
    "grid size-10 place-items-center rounded-full text-brand transition-colors duration-(--duration-fast) hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** "Install the app", as a small tinted icon in the header: one tap where the browser supports it, the steps on iPhone. */
export const InstallButton = () => {
    const {t} = useTranslation();
    const {canPrompt, needsIosSteps, install} = useInstallPrompt();

    if (canPrompt) {
        return (
            <button type="button" onClick={() => void install()} aria-label={t("install.button")} title={t("install.button")} className={ICON_BUTTON}>
                <Download className="size-[18px]" strokeWidth={1.5}/>
            </button>
        );
    }

    if (!needsIosSteps) return null;

    return (
        <Popover>
            <PopoverTrigger aria-label={t("install.button")} className={ICON_BUTTON}>
                <Download className="size-[18px]" strokeWidth={1.5}/>
            </PopoverTrigger>
            <PopoverContent align="end">
                <p className="mb-2 font-medium">{t("install.iosTitle")}</p>
                <ol className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Share className="size-4 shrink-0 text-brand"/>
                        {t("install.iosStep1")}
                    </li>
                    <li className="flex items-center gap-2">
                        <SquarePlus className="size-4 shrink-0 text-brand"/>
                        {t("install.iosStep2")}
                    </li>
                </ol>
            </PopoverContent>
        </Popover>
    );
};
