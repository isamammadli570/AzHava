import {useSyncExternalStore} from "react";
import {STORAGE_KEYS} from "@/constants/storage";
import {isSeason, type Season} from "@/helpers/season";
import {storageGet, storageSet} from "@/lib/localStorage";

export type SeasonPreference = Season | "auto";

const listeners = new Set<() => void>();

const read = (): SeasonPreference => {
    const stored = storageGet(STORAGE_KEYS.SEASON);
    return isSeason(stored) ? stored : "auto";
};

let snapshot = read();

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const setPreference = (next: SeasonPreference) => {
    snapshot = next;
    storageSet(STORAGE_KEYS.SEASON, next);
    listeners.forEach((listener) => listener());
};

/**
 * "Auto" follows the real season of the place on screen; picking one shows the app in that season's look anyway,
 * so the four looks can be seen in any month. Remembered in localStorage.
 */
export const useSeasonPreference = () => ({
    preference: useSyncExternalStore(subscribe, () => snapshot, () => snapshot),
    setPreference,
});
