import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import * as path from "node:path";
import type {Plugin} from "vite";

/** Files from `public/` that the app needs offline (build output is added automatically). */
const PUBLIC_FILES = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

/**
 * Emits `sw.js` at build time from `pwa/sw-template.js`, filled with every bundled file name and a version derived
 * from them. A changed build gives a new version, which is what makes the browser offer the update.
 * Dev builds get no service worker (registration is production-only).
 */
export const serviceWorkerPlugin = (): Plugin => ({
    name: "azhava-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
        const built = Object.keys(bundle)
            // Greek and Vietnamese font subsets are never used by AZ/EN/RU text; no need to store them offline.
            .filter((fileName) => !fileName.endsWith(".map") && fileName !== "index.html" && !/-(greek|vietnamese)/.test(fileName))
            .map((fileName) => `/${fileName}`);
        const precache = [...PUBLIC_FILES, ...built].sort();
        const version = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 12);
        const template = readFileSync(path.resolve(import.meta.dirname, "sw-template.js"), "utf8");

        this.emitFile({
            type: "asset",
            fileName: "sw.js",
            source: template.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(precache, null, 4)),
        });
    },
});
