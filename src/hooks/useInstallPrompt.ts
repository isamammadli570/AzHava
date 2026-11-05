import {useSyncExternalStore} from "react";
import {installStore} from "@/services/pwa";

/** Where an iPhone visitor is: Safari, another browser (Chrome, Edge, Firefox) or a browser inside an app. */
export type IosBrowser = "safari" | "other" | "inApp";

const IN_APP = /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|TikTok|musical_ly|Snapchat|GSA\//;

/**
 * Which kind of iOS browser this is, or null off iOS. Only Safari and (since iOS 16.4) the other browsers can add a
 * page to the Home Screen; browsers built into apps (Instagram, Facebook, TikTok, and the bare web views of others,
 * whose agent lacks the "Safari/" token) cannot, so the visitor has to open the page in Safari first.
 */
const iosBrowser = (): IosBrowser | null => {
    const agent = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIos) return null;
    if (IN_APP.test(agent)) return "inApp";
    if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(agent)) return "other";
    return /Safari\//.test(agent) ? "safari" : "inApp";
};

/** Running from the Home Screen already (iOS reports it on `navigator.standalone`). */
const isStandalone = () => (navigator as Navigator & {standalone?: boolean}).standalone === true;

/**
 * Whether the app can be installed and how: Chrome/Android/desktop give a real prompt; on an iPhone there is none, so
 * the UI shows the steps for the browser in use. Nothing is offered once the app is installed.
 */
export const useInstallPrompt = () => {
    const {prompt, isInstalled} = useSyncExternalStore(installStore.subscribe, installStore.get, installStore.get);
    const installed = isInstalled || isStandalone();

    const install = async () => {
        if (!prompt) return;
        await prompt.prompt();
        await prompt.userChoice;
        installStore.clearPrompt();
    };

    return {canPrompt: prompt !== null && !installed, iosBrowser: installed || prompt !== null ? null : iosBrowser(), install};
};
