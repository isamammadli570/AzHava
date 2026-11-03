import {useEffect, useRef, useState} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {radarTileUrl, type RadarFrames} from "@/api/radar.api";

// Esri's keyless dark grey canvas: the base without labels under the radar, the place names in a layer above it.
const BASE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const BASE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";
const LABELS_Z_INDEX = 100;
const RADAR_ATTRIBUTION = '<a href="https://www.rainviewer.com/">RainViewer</a>';
const RADAR_OPACITY = 0.8;
/** RainViewer serves radar tiles up to this zoom; deeper zooms upscale them. */
const RADAR_MAX_NATIVE_ZOOM = 7;

type RadarMapProps = {
    latitude: number;
    longitude: number;
    pinLabel: string;
    radar: RadarFrames;
    frameIndex: number;
};

/**
 * Leaflet map (dark basemap) with one tile layer per radar frame. Layers are kept once created, so after the first
 * loop "playing" only flips which layer is visible. The code is loaded lazily (Leaflet is ~40 KB gzipped).
 */
export const RadarMap = ({latitude, longitude, pinLabel, radar, frameIndex}: RadarMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.TileLayer[]>([]);
    const pinRef = useRef<L.Marker | null>(null);
    // The map is built over three frames (base, then labels and pin, then radar) instead of one long task.
    const [isBuilt, setIsBuilt] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const map = L.map(container, {
            center: [latitude, longitude],
            zoom: 6,
            minZoom: 3,
            maxZoom: 10,
            zoomControl: false,
            // The page scrolls with the wheel; the map zooms with pinch, double tap or the keyboard instead.
            scrollWheelZoom: false,
            attributionControl: true,
        });
        map.attributionControl.setPrefix(false);
        L.tileLayer(BASE_TILES, {attribution: BASE_ATTRIBUTION, maxNativeZoom: 16, maxZoom: 19}).addTo(map);
        mapRef.current = map;
        const frame = requestAnimationFrame(() => {
            L.tileLayer(LABEL_TILES, {maxNativeZoom: 16, maxZoom: 19, zIndex: LABELS_Z_INDEX}).addTo(map);
            setIsBuilt(true);
        });
        return () => {
            cancelAnimationFrame(frame);
            map.remove();
            mapRef.current = null;
            layersRef.current = [];
            pinRef.current = null;
        };
        // The map is created once; later place changes only move it (next effect).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isBuilt) return;
        map.setView([latitude, longitude], map.getZoom(), {animate: true});
        const icon = L.divIcon({className: "radar-pin", html: `<span>${pinLabel}</span>`, iconSize: [44, 28], iconAnchor: [22, 14]});
        if (pinRef.current) pinRef.current.setLatLng([latitude, longitude]).setIcon(icon);
        else pinRef.current = L.marker([latitude, longitude], {icon, keyboard: false, interactive: false}).addTo(map);
    }, [latitude, longitude, pinLabel, isBuilt]);

    // A new frame list (every few minutes) drops the old layers.
    useEffect(() => {
        layersRef.current.forEach((layer) => layer?.remove());
        layersRef.current = [];
    }, [radar]);

    // Layers are created as the animation reaches them, plus one ahead so its tiles are loaded before it is shown.
    // Creating all 13 at once would mean ~80 tile images and a long frame right when the map appears.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isBuilt) return;
        const ensureLayer = (index: number): L.TileLayer | undefined => {
            const frame = radar.frames[index];
            if (!frame) return undefined;
            layersRef.current[index] ??= L.tileLayer(radarTileUrl(radar.host, frame), {
                opacity: 0,
                zIndex: 10 + index,
                maxNativeZoom: RADAR_MAX_NATIVE_ZOOM,
                attribution: RADAR_ATTRIBUTION,
            }).addTo(map);
            return layersRef.current[index];
        };
        ensureLayer(frameIndex);
        ensureLayer((frameIndex + 1) % radar.frames.length);
        layersRef.current.forEach((layer, index) => layer?.setOpacity(index === frameIndex ? RADAR_OPACITY : 0));
    }, [frameIndex, radar, isBuilt]);

    return <div ref={containerRef} className="size-full"/>;
};
