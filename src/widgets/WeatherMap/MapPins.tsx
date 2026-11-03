import {useEffect, useRef, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";
import L from "leaflet";

export type MapPin = {
    id: string;
    latitude: number;
    longitude: number;
    content: ReactNode;
    /** Pins drawn above others (the place being viewed). */
    isOnTop?: boolean;
    onSelect?: () => void;
};

type PinMarkerProps = {map: L.Map; pin: MapPin};

/** One pin: an empty Leaflet marker element that the pin's React content is portalled into. */
const PinMarker = ({map, pin}: PinMarkerProps) => {
    const {latitude, longitude, isOnTop = false, onSelect} = pin;
    const [element] = useState(() => document.createElement("div"));
    const markerRef = useRef<L.Marker | null>(null);
    const isInteractive = Boolean(onSelect);

    useEffect(() => {
        const marker = L.marker([latitude, longitude], {
            icon: L.divIcon({html: element, className: "map-pin", iconSize: [0, 0]}),
            keyboard: false,
            interactive: isInteractive,
            zIndexOffset: isOnTop ? 1000 : 0,
        }).addTo(map);
        markerRef.current = marker;
        return () => {
            marker.remove();
            markerRef.current = null;
        };
        // Created once per pin; moves are applied by the next effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, element, isInteractive, isOnTop]);

    useEffect(() => {
        markerRef.current?.setLatLng([latitude, longitude]);
    }, [latitude, longitude]);

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker || !onSelect) return;
        marker.on("click", onSelect);
        return () => {
            marker.off("click", onSelect);
        };
    }, [onSelect]);

    return createPortal(pin.content, element);
};

type MapPinsProps = {map: L.Map; pins: MapPin[]};

/**
 * React content as Leaflet markers, so pins are ordinary components (icons, live temperatures, styles) while Leaflet
 * keeps them in place as the map moves.
 */
export const MapPins = ({map, pins}: MapPinsProps) => (
    <>
        {pins.map((pin) => <PinMarker key={pin.id} map={map} pin={pin}/>)}
    </>
);
