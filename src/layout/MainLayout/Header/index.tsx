import {useState} from "react";
import {Ellipsis, Grip, Search} from "lucide-react";
import {Link, NavLink} from "react-router";
import {Dialog} from "radix-ui";
import {useTranslation} from "react-i18next";
import {ROUTES} from "@/constants/routes";
import {SEASONS} from "@/helpers/season";
import {LANGUAGE_LABELS, SUPPORTED_LANGUAGES, toLanguage} from "@/i18n/resources";
import {useHotkey} from "@/hooks/useHotkey";
import {useLanguage} from "@/hooks/useLanguage";
import {useSeasonPreference, type SeasonPreference} from "@/hooks/useSeasonPreference";
import {preloadRoute} from "@/router/preload";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {InstallButton} from "@/widgets/InstallButton";
import {PlaceSearch} from "@/widgets/PlaceSearch";
import {cn} from "@/lib/utils";

const ICON_BUTTON =
    "grid size-10 place-items-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** "⋯" menu: language and season (automatic, or any of the four looks on demand). */
const SettingsMenu = () => {
    const {t} = useTranslation();
    const {language, changeLanguage} = useLanguage();
    const {preference, setPreference} = useSeasonPreference();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("menu.open")} className={ICON_BUTTON}>
                <Ellipsis className="size-5" strokeWidth={1.5}/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{t("menu.language")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => changeLanguage(toLanguage(value))}>
                    {SUPPORTED_LANGUAGES.map((code) => (
                        <DropdownMenuRadioItem key={code} value={code}>
                            <span className="w-6 text-xs font-medium text-muted-foreground uppercase">{code}</span>
                            {LANGUAGE_LABELS[code]}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator/>
                <DropdownMenuLabel>{t("menu.season")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as SeasonPreference)}>
                    <DropdownMenuRadioItem value="auto">{t("menu.auto")}</DropdownMenuRadioItem>
                    {SEASONS.map((season) => (
                        <DropdownMenuRadioItem key={season} value={season}>{t(`seasons.${season}`)}</DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/**
 * Instrument-panel header: cities on the left, the spaced wordmark in the middle, search, install and the menu on
 * the right. Search opens a sheet over the page; "/" opens it from anywhere.
 */
export const Header = () => {
    const {t} = useTranslation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    useHotkey("/", () => setIsSearchOpen(true));

    return (
        <header className="relative z-30 mx-auto w-full max-w-7xl px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                <NavLink
                    to={ROUTES.CITIES}
                    aria-label={t("nav.cities")}
                    title={t("nav.cities")}
                    onPointerEnter={() => preloadRoute(ROUTES.CITIES)}
                    onFocus={() => preloadRoute(ROUTES.CITIES)}
                    className={({isActive}) => cn(ICON_BUTTON, "justify-self-start", isActive && "text-foreground")}
                >
                    <Grip className="size-5" strokeWidth={1.5}/>
                </NavLink>

                <Link to={ROUTES.ROOT} aria-label={t("nav.home")} className="rounded-xl px-2 py-1 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    <span className="block pl-[0.6em] text-[15px] font-light tracking-[0.6em]">AZHAVA</span>
                    <span className="block pl-[0.4em] text-[8.5px] font-light tracking-[0.4em] text-muted-foreground uppercase">{t("brandSubtitle")}</span>
                </Link>

                <div className="flex items-center justify-self-end">
                    <Dialog.Root open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                        <Dialog.Trigger aria-label={t("search.open")} title={t("search.open")} className={ICON_BUTTON}>
                            <Search className="size-[18px]" strokeWidth={1.5}/>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"/>
                            <Dialog.Content
                                aria-describedby={undefined}
                                className="glass-strong fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-[1.75rem] p-3 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 sm:top-[10vh]"
                            >
                                <Dialog.Title className="sr-only">{t("search.label")}</Dialog.Title>
                                <PlaceSearch isInline onChoose={() => setIsSearchOpen(false)}/>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                    <InstallButton/>
                    <SettingsMenu/>
                </div>
            </div>
        </header>
    );
};
