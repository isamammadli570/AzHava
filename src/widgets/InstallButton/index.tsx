import type {ReactNode} from "react";
import {Compass, Copy, Download, Ellipsis, Share, SquarePlus} from "lucide-react";
import {useTranslation} from "react-i18next";
import {toast} from "sonner";
import {useInstallPrompt, type IosBrowser} from "@/hooks/useInstallPrompt";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

const ICON_BUTTON =
    "grid size-10 place-items-center rounded-full text-brand transition-colors duration-(--duration-fast) hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const Step = ({icon, children}: {icon: ReactNode; children: ReactNode}) => (
    <li className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-brand [&_svg]:size-4">{icon}</span>
        <span>{children}</span>
    </li>
);

/** The Home Screen steps for the kind of iPhone browser in use. */
const IosSteps = ({browser}: {browser: IosBrowser}) => {
    const {t} = useTranslation();

    if (browser === "inApp") {
        const copyLink = () =>
            void navigator.clipboard
                ?.writeText(window.location.href)
                .then(() => toast.success(t("install.ios.copied")))
                .catch(() => undefined);
        return (
            <>
                <p className="mb-3 text-muted-foreground">{t("install.ios.inAppNote")}</p>
                <ol className="space-y-2.5 text-muted-foreground">
                    <Step icon={<Ellipsis/>}>{t("install.ios.inAppStep1")}</Step>
                    <Step icon={<Compass/>}>{t("install.ios.inAppStep2")}</Step>
                </ol>
                <button
                    type="button"
                    onClick={copyLink}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-[13px] font-medium transition-colors hover:bg-white/15"
                >
                    <Copy className="size-4"/>
                    {t("install.ios.copy")}
                </button>
            </>
        );
    }

    return (
        <ol className="space-y-2.5 text-muted-foreground">
            <Step icon={<Share/>}>{t(browser === "safari" ? "install.ios.safariStep1" : "install.ios.otherStep1")}</Step>
            <Step icon={<SquarePlus/>}>{t("install.ios.step2")}</Step>
            <Step icon={<Download/>}>{t("install.ios.step3")}</Step>
        </ol>
    );
};

/** "Install the app", as a small tinted icon in the header: one tap where the browser supports it, the steps on iPhone. */
export const InstallButton = () => {
    const {t} = useTranslation();
    const {canPrompt, iosBrowser, install} = useInstallPrompt();

    if (canPrompt) {
        return (
            <button type="button" onClick={() => void install()} aria-label={t("install.button")} title={t("install.button")} className={ICON_BUTTON}>
                <Download className="size-[18px]" strokeWidth={1.5}/>
            </button>
        );
    }

    if (!iosBrowser) return null;

    return (
        <Popover>
            <PopoverTrigger aria-label={t("install.button")} className={ICON_BUTTON}>
                <Download className="size-[18px]" strokeWidth={1.5}/>
            </PopoverTrigger>
            <PopoverContent align="end">
                <p className="mb-2.5 font-medium">{t("install.iosTitle")}</p>
                <IosSteps browser={iosBrowser}/>
            </PopoverContent>
        </Popover>
    );
};
