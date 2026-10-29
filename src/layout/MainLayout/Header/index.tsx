import {LayoutGrid} from "lucide-react";
import {Link, NavLink} from "react-router";
import {useTranslation} from "react-i18next";
import {ROUTES} from "@/constants/routes";
import {preloadRoute} from "@/router/preload";
import {buttonVariants} from "@/components/ui/button";
import {Logo} from "@/widgets/Logo";
import {PlaceSearch} from "@/widgets/PlaceSearch";
import {LanguageSwitcher} from "@/widgets/LanguageSwitcher";
import {InstallButton} from "@/widgets/InstallButton";
import {cn} from "@/lib/utils";

/** Logo, search and controls. On phones the search drops to its own full-width row. */
export const Header = () => {
    const {t} = useTranslation();

    return (
        <header className="relative z-30 mx-auto w-full max-w-7xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4">
                <Link to={ROUTES.ROOT} viewTransition aria-label={t("nav.home")} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    <Logo/>
                </Link>
                <PlaceSearch className="col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto sm:mx-auto sm:w-full sm:max-w-md"/>
                <nav className="col-start-3 flex items-center gap-2">
                    <NavLink
                        to={ROUTES.CITIES}
                        viewTransition
                        onPointerEnter={() => preloadRoute(ROUTES.CITIES)}
                        onFocus={() => preloadRoute(ROUTES.CITIES)}
                        className={({isActive}) => cn(buttonVariants({variant: isActive ? "solid" : "glass", size: "md"}), "px-3 sm:px-4")}
                    >
                        <LayoutGrid/>
                        <span className="hidden sm:inline">{t("nav.cities")}</span>
                        <span className="sr-only sm:hidden">{t("nav.cities")}</span>
                    </NavLink>
                    <InstallButton/>
                    <LanguageSwitcher/>
                </nav>
            </div>
        </header>
    );
};
