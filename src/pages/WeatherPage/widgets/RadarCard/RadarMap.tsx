import {useEffect, useMemo, useRef, useState} from "react";
import type L from "leaflet";
import type {RadarFrames} from "@/api/radar.api";
import {createRadarLayers, createWeatherMap} from "@/widgets/WeatherMap/mapKit";
import {MapPins} from "@/widgets/WeatherMap/MapPins";
import {PlacePin} from "@/widgets/WeatherMap/pins";

type RadarMapProps = {
    latitude: number;
    longitude: number;
    placeName: string;
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    radar: RadarFrames;
    frameIndex: number;
};

/**
 * The card's map preview, like the iOS rain card: a fixed dark map with the radar under the place names and the
 * place as a temperature bubble. Tapping the card opens the full map. Loaded lazily (Leaflet is ~40 KB gzipped).
 */
export const RadarMap = ({latitude, longitude, placeName, temperature, weatherCode, isDay, radar, frameIndex}: RadarMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const radarRef = useRef<ReturnType<typeof createRadarLayers> | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const created = createWeatherMap(container, {latitude, longitude, zoom: 5.5, isInteractive: false});
        let isLive = true;
        // The radar comes a frame after the base and labels, so the map's first paint stays short.
        void created.ready.then(() => {
            if (!isLive) return;
            radarRef.current = createRadarLayers(created.map);
            setMap(created.map);
        });
        return () => {
            isLive = false;
            created.map.remove();
            radarRef.current = null;
            setMap(null);
        };
        // The map is created once; later place changes only move it (next effect).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        map?.setView([latitude, longitude], map.getZoom(), {animate: true});
    }, [map, latitude, longitude]);

    useEffect(() => {
        if (!map || !radarRef.current) return;
        radarRef.current.setFrames(radar);
        radarRef.current.show(frameIndex);
    }, [map, radar, frameIndex]);

    const pins = useMemo(
        () => [
            {
                id: "place",
                latitude,
                longitude,
                isOnTop: true,
                content: <PlacePin temperature={temperature} weatherCode={weatherCode} isDay={isDay} name={placeName} isCurrent/>,
            },
        ],
        [latitude, longitude, temperature, weatherCode, isDay, placeName],
    );

    return (
        <>
            <div ref={containerRef} className="size-full"/>
            {map && <MapPins map={map} pins={pins}/>}
        </>
    );
};
