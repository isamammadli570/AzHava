import {useSyncExternalStore} from "react";
import {installStore} from "@/services/pwa";

const isIosSafari = (): boolean => {
    const agent = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return isIos && /Safari/.test(agent) && !/CriOS|FxiOS|EdgiOS/.test(agent);
};

/**
 * Whether the app can be installed and how: Chrome/Android/desktop give a real prompt; iPhone Safari has none, so
 * the UI shows the "Share → Add to Home Screen" steps instead. Nothing is offered once the app is installed.
 */
export const useInstallPrompt = () => {
    const {prompt, isInstalled} = useSyncExternalStore(installStore.subscribe, installStore.get, installStore.get);

    const install = async () => {
        if (!prompt) return;
        await prompt.prompt();
        await prompt.userChoice;
        installStore.clearPrompt();
    };

    return {canPrompt: prompt !== null && !isInstalled, needsIosSteps: !isInstalled && prompt === null && isIosSafari(), install};
};
