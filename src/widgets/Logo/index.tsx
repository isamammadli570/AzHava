import {useTranslation} from "react-i18next";
import {cn} from "@/lib/utils";

type LogoProps = {className?: string; isCompact?: boolean};

/** AzHava mark (sun behind a cloud) and wordmark. */
export const Logo = ({className, isCompact = false}: LogoProps) => {
    const {t} = useTranslation();

    return (
        <span className={cn("inline-flex items-center gap-2.5", className)}>
            <svg viewBox="0 0 64 64" className="size-9 shrink-0 drop-shadow-[0_4px_16px_rgb(255_200_87/0.35)]" aria-hidden>
                <defs>
                    <linearGradient id="logo-sun" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#ffe08a"/>
                        <stop offset="1" stopColor="#ff9f1c"/>
                    </linearGradient>
                </defs>
                <rect width="64" height="64" rx="18" fill="rgb(255 255 255 / 0.1)" stroke="rgb(255 255 255 / 0.22)"/>
                <circle cx="38" cy="25" r="11" fill="url(#logo-sun)"/>
                <path d="M18 47h26a9 9 0 0 0 0-18 12 12 0 0 0-23 3 7.5 7.5 0 0 0-3 15z" fill="#f4f8ff"/>
            </svg>
            {!isCompact && (
                <span className="font-display text-lg font-bold tracking-tight">
                    Az<span className="text-brand">Hava</span>
                    <span className="sr-only"> — {t("tagline")}</span>
                </span>
            )}
        </span>
    );
};
