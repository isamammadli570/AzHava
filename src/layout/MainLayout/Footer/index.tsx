import {useTranslation} from "react-i18next";

/** Open-Meteo's licence (CC BY 4.0) asks for attribution wherever its data is shown. */
export const Footer = () => {
    const {t} = useTranslation();

    return (
        <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-xs text-subtle-foreground sm:px-6 lg:px-8">
            <p>
                {t("footer.data")}:{" "}
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    Open-Meteo.com
                </a>{" "}
                (CC BY 4.0)
            </p>
            <p>
                {t("appName")} · {t("footer.portfolio")} · {new Date().getFullYear()}
            </p>
        </footer>
    );
};
