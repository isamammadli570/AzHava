/* AzHava service worker. Built by pwa/plugin.ts, which fills in the version and the precache list. */

const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;

const SHELL_CACHE = `azhava-shell-${VERSION}`;
const DATA_CACHE = "azhava-data";
const DATA_HOSTS = ["api.open-meteo.com", "air-quality-api.open-meteo.com"];
const MAX_DATA_ENTRIES = 40;

// The whole app (HTML, JS, CSS, fonts, icons) is stored on install, so it opens with no connection at all.
self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith("azhava-shell-") && key !== SHELL_CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

// A new version waits until the page says the user agreed to reload (see src/services/pwa.ts).
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const trimDataCache = async (cache) => {
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_DATA_ENTRIES)).map((key) => cache.delete(key)));
};

/** Weather data: always try the network first (live data wins); the last good answer is the offline fallback. */
const networkFirstData = async (request) => {
    const cache = await caches.open(DATA_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            // Delete first so the entry moves to the end of the key list: trimming then drops the least recent.
            await cache.delete(request);
            await cache.put(request, response.clone());
            void trimDataCache(cache);
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
};

/** Pages: network first so a new deploy shows up, the cached app shell when offline. */
const networkFirstPage = async (request) => {
    try {
        return await fetch(request);
    } catch {
        return (await caches.match("/index.html")) ?? Response.error();
    }
};

/** Hashed build files never change, so the cache is always right for them. */
const cacheFirst = async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.put(request, response.clone());
    }
    return response;
};

self.addEventListener("fetch", (event) => {
    const {request} = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);

    if (DATA_HOSTS.includes(url.hostname)) {
        event.respondWith(networkFirstData(request));
    } else if (url.origin === self.location.origin) {
        event.respondWith(request.mode === "navigate" ? networkFirstPage(request) : cacheFirst(request));
    }
});
