import {useCallback, useMemo, useState} from "react";
import {Outlet, useNavigation} from "react-router";
import {WifiOff} from "lucide-react";
import {useTranslation} from "react-i18next";
import {DEFAULT_SCENE, isSameScene, type Scene} from "@/helpers/weather";
import {useOnlineStatus} from "@/hooks/useOnlineStatus";
import {useSpotlight} from "@/hooks/useSpotlight";
import {SkyBackground} from "@/widgets/SkyBackground";
import {WeatherIconDefs} from "@/widgets/WeatherIcon";
import {Header} from "@/layout/MainLayout/Header";
import {Footer} from "@/layout/MainLayout/Footer";
import type {LayoutContext} from "@/layout/MainLayout/sceneContext";
import {cn} from "@/lib/utils";

/** App shell: the live sky (driven by whichever page is open), header, page and footer. */
export const MainLayout = () => {
    const {t} = useTranslation();
    const navigation = useNavigation();
    const isOnline = useOnlineStatus();
    const [scene, setSceneState] = useState<Scene>(DEFAULT_SCENE);
    useSpotlight();

    const setScene = useCallback((next: Scene) => setSceneState((previous) => (isSameScene(previous, next) ? previous : next)), []);
    const context = useMemo<LayoutContext>(() => ({setScene}), [setScene]);

    return (
        <>
            <SkyBackground scene={scene}/>
            <WeatherIconDefs/>
            <a href="#main" className="sr-only z-50 rounded-full bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
                {t("skipToContent")}
            </a>
            <div
                aria-hidden
                className={cn(
                    "fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-brand via-accent to-brand transition-[scale,opacity] duration-700 ease-(--ease-out)",
                    navigation.state === "loading" ? "scale-x-75 opacity-100" : "scale-x-100 opacity-0",
                )}
            />
            <div className="relative flex min-h-dvh flex-col">
                <Header/>
                {!isOnline && (
                    <div role="status" className="mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-7xl animate-fade-up items-center gap-3 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning ring-1 ring-warning/30 backdrop-blur-xl sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
                        <WifiOff className="size-4 shrink-0" aria-hidden/>
                        {t("offline")}
                    </div>
                )}
                <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
                    <Outlet context={context}/>
                </main>
                <Footer/>
            </div>
        </>
    );
};
