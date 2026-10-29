import {useTranslation} from "react-i18next";
import {Logo} from "@/widgets/Logo";

/** Splash shown while a route chunk loads for the first time. */
export const Loading = () => {
    const {t} = useTranslation();

    return (
        <div role="status" className="sky-clear-night fixed inset-0 flex flex-col items-center justify-center gap-4">
            <Logo className="animate-float scale-125"/>
            <span className="sr-only">{t("loading")}</span>
        </div>
    );
};
