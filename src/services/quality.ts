const QUALITY_KEY = "azhava:quality";
const LOW = "low";

const SETTLE_MS = 2500;
const SAMPLE_MS = 2000;
const LOW_FPS = 50;

type NetworkInformation = {saveData?: boolean};

export const isLowQuality = (): boolean => document.documentElement.dataset.quality === LOW;

const setLowQuality = () => {
    document.documentElement.dataset.quality = LOW;
    try {
        sessionStorage.setItem(QUALITY_KEY, LOW);
    } catch {
        /* private mode */
    }
    window.dispatchEvent(new Event(QUALITY_KEY));
};

/** Subscribes to the switch to low quality (the rain canvas uses it to thin out its particles). */
export const onQualityChange = (listener: () => void) => {
    window.addEventListener(QUALITY_KEY, listener);
    return () => window.removeEventListener(QUALITY_KEY, listener);
};

/** Average frames per second over a window, measured with requestAnimationFrame. */
const sampleFps = (durationMs: number): Promise<number> =>
    new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = (time: number) => {
            frames++;
            if (time - start < durationMs) requestAnimationFrame(tick);
            else resolve((frames * 1000) / (time - start));
        };
        requestAnimationFrame(tick);
    });

/**
 * Dynamic quality, like a game's auto-settings: once the page has settled, measure the real frame rate; if the device
 * cannot hold ~50 fps, switch to the light preset (CSS under `[data-quality="low"]`): no glass blur, fewer clouds and
 * particles, no stars or wind streaks. Data-saver mode goes straight to light. Strong devices are never touched.
 */
export const initAdaptiveQuality = () => {
    const connection = (navigator as Navigator & {connection?: NetworkInformation}).connection;
    let remembered: string | null = null;
    try {
        remembered = sessionStorage.getItem(QUALITY_KEY);
    } catch {
        /* private mode */
    }
    if (remembered === LOW || connection?.saveData) {
        setLowQuality();
        return;
    }

    window.setTimeout(() => {
        // A hidden tab runs no frames at all; measure only what the user actually sees.
        if (document.visibilityState !== "visible") return;
        void sampleFps(SAMPLE_MS).then((fps) => {
            if (fps < LOW_FPS && document.visibilityState === "visible") setLowQuality();
        });
    }, SETTLE_MS);
};
