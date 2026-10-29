import {useTranslation} from "react-i18next";
import {AUTHOR} from "@/constants/author";

/** Author credit, plus the attribution Open-Meteo's licence (CC BY 4.0) asks for wherever its data is shown. */
export const Footer = () => {
    const {t} = useTranslation();

    return (
        <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-xs text-subtle-foreground sm:px-6 lg:px-8">
            <p>
                {t("footer.madeBy")}{" "}
                <a
                    href={AUTHOR.GITHUB}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded font-display text-sm font-bold text-brand underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    {AUTHOR.NAME}
                </a>
                <span className="mx-1.5">·</span>
                {t("appName")} · {new Date().getFullYear()}
            </p>
            <p>
                {t("footer.data")}:{" "}
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    Open-Meteo.com
                </a>{" "}
                (CC BY 4.0)
            </p>
        </footer>
    );
};
