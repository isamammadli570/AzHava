export function isLocalStorageAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function storageGet(key: string): string | null {
    if (!isLocalStorageAvailable()) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function storageSet(key: string, value: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        /* quota, private mode */
    }
}

export function storageRemove(key: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

/** Reads a JSON value; anything unparsable counts as missing. */
export function storageGetJson(key: string): unknown {
    const raw = storageGet(key);
    if (raw === null) return null;
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}
