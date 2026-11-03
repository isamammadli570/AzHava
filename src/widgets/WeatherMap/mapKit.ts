import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {radarTileUrl, type RadarFrames} from "@/api/radar.api";

// Esri's keyless dark grey canvas: the base without labels under the weather, the place names in a layer above it.
const BASE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const BASE_ATTRIBUTION = "&copy; Esri, HERE, Garmin, OpenStreetMap";
const RADAR_ATTRIBUTION = '<a href="https://www.rainviewer.com/">RainViewer</a>';
/** Labels sit above every radar frame, so city names stay readable through the rain (as on iOS). */
const LABELS_Z_INDEX = 100;
/** RainViewer serves radar tiles up to this zoom; deeper zooms upscale them. */
const RADAR_MAX_NATIVE_ZOOM = 7;
export const RADAR_OPACITY = 0.85;

type MapOptions = {latitude: number; longitude: number; zoom: number; isInteractive: boolean};

/**
 * A dark weather map: the base, then (a frame later, to keep the first paint short) the place-name layer. A preview
 * map is fixed (no dragging or zooming); the full-screen map pans, pinches, wheel-zooms and double-taps.
 */
export const createWeatherMap = (container: HTMLElement, {latitude, longitude, zoom, isInteractive}: MapOptions): {map: L.Map; ready: Promise<void>} => {
    const map = L.map(container, {
        center: [latitude, longitude],
        zoom,
        minZoom: 3,
        maxZoom: 10,
        zoomControl: false,
        zoomSnap: 0.5,
        dragging: isInteractive,
        touchZoom: isInteractive,
        doubleClickZoom: isInteractive,
        scrollWheelZoom: isInteractive,
        boxZoom: false,
        keyboard: isInteractive,
        attributionControl: true,
        worldCopyJump: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer(BASE_TILES, {attribution: BASE_ATTRIBUTION, maxNativeZoom: 16, maxZoom: 19}).addTo(map);
    const ready = new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            L.tileLayer(LABEL_TILES, {maxNativeZoom: 16, maxZoom: 19, zIndex: LABELS_Z_INDEX}).addTo(map);
            resolve();
        });
    });
    return {map, ready};
};

/**
 * Keeps one tile layer per radar frame on a map and shows one of them. Layers are created as playback reaches them,
 * plus the next one, so its tiles are loaded before it is shown; changing frames cross-fades (CSS on `.radar-frame`).
 */
export const createRadarLayers = (map: L.Map) => {
    let layers: (L.TileLayer | undefined)[] = [];
    let source: RadarFrames | null = null;

    const ensure = (index: number): void => {
        const frame = source?.frames[index];
        if (!source || !frame || layers[index]) return;
        layers[index] = L.tileLayer(radarTileUrl(source.host, frame), {
            opacity: 0,
            zIndex: 10 + index,
            maxNativeZoom: RADAR_MAX_NATIVE_ZOOM,
            attribution: RADAR_ATTRIBUTION,
            className: "radar-frame",
        }).addTo(map);
    };

    return {
        setFrames(frames: RadarFrames) {
            if (frames === source) return;
            layers.forEach((layer) => layer?.remove());
            layers = [];
            source = frames;
        },
        show(index: number | null) {
            if (index !== null && source) {
                ensure(index);
                ensure((index + 1) % source.frames.length);
            }
            layers.forEach((layer, layerIndex) => layer?.setOpacity(layerIndex === index ? RADAR_OPACITY : 0));
        },
    };
};
