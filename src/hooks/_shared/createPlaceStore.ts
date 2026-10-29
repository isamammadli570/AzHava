import {useSyncExternalStore} from "react";
import {isPlace, type Place} from "@/helpers/place";
import {storageGetJson, storageSet} from "@/lib/localStorage";

/**
 * A list of places kept in localStorage and shared live between components and open tabs.
 * Used for favourites and for recently viewed places.
 */
export const createPlaceStore = (storageKey: string, limit: number) => {
    const listeners = new Set<() => void>();

    const read = (): Place[] => {
        const stored = storageGetJson(storageKey);
        return Array.isArray(stored) ? stored.filter(isPlace).slice(0, limit) : [];
    };

    // The snapshot must keep its identity between reads, otherwise useSyncExternalStore re-renders forever.
    let snapshot: Place[] = read();

    const emit = () => listeners.forEach((listener) => listener());

    const write = (next: Place[]) => {
        snapshot = next.slice(0, limit);
        storageSet(storageKey, JSON.stringify(snapshot));
        emit();
    };

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        const syncTabs = (event: StorageEvent) => {
            if (event.key !== storageKey) return;
            snapshot = read();
            emit();
        };
        window.addEventListener("storage", syncTabs);
        return () => {
            listeners.delete(listener);
            window.removeEventListener("storage", syncTabs);
        };
    };

    return {
        get: () => snapshot,
        write,
        /** Moves the place to the front, adding it if new. */
        promote: (place: Place) => write([place, ...snapshot.filter((item) => item.id !== place.id)]),
        remove: (placeId: string) => write(snapshot.filter((item) => item.id !== placeId)),
        useList: () => useSyncExternalStore(subscribe, () => snapshot, () => snapshot),
    };
};
