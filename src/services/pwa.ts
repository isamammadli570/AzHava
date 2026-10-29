import {toast} from "sonner";
import i18n from "@/i18n";

/** Chrome's install prompt event; not in the TypeScript DOM library. */
export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
};

type InstallState = {prompt: BeforeInstallPromptEvent | null; isInstalled: boolean};

const listeners = new Set<() => void>();
let installState: InstallState = {
    prompt: null,
    isInstalled: typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
};

const setInstallState = (next: Partial<InstallState>) => {
    installState = {...installState, ...next};
    listeners.forEach((listener) => listener());
};

/** Install prompt state as an external store, read by `useInstallPrompt`. */
export const installStore = {
    get: () => installState,
    subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    clearPrompt: () => setInstallState({prompt: null}),
};

const offerUpdate = (worker: ServiceWorker) => {
    toast(i18n.t("common:update.ready"), {
        duration: Infinity,
        action: {label: i18n.t("common:update.reload"), onClick: () => worker.postMessage({type: "SKIP_WAITING"})},
    });
};

/**
 * Production only: registers `/sw.js` (offline app shell + last forecast), offers a reload when a new deploy is
 * ready, and captures the install prompt. The prompt event can fire before React mounts, hence a module-level listener.
 */
export const initPwa = () => {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        setInstallState({prompt: event as BeforeInstallPromptEvent});
    });
    window.addEventListener("appinstalled", () => {
        setInstallState({prompt: null, isInstalled: true});
        toast.success(i18n.t("common:install.done"));
    });

    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    // Only a page that was already controlled should reload on a new worker; the very first install must not.
    const hadController = navigator.serviceWorker.controller !== null;
    let isReloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || isReloading) return;
        isReloading = true;
        window.location.reload();
    });

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                if (registration.waiting && hadController) offerUpdate(registration.waiting);
                registration.addEventListener("updatefound", () => {
                    const worker = registration.installing;
                    worker?.addEventListener("statechange", () => {
                        if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
                    });
                });
            })
            .catch(() => {
                /* No offline support in this browser; the site still works online. */
            });
    });
};
