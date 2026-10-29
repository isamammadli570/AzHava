import {useState} from "react";
import {useNavigate} from "react-router";
import {useTranslation} from "react-i18next";
import {toast} from "sonner";
import {matchingCity, placeFromCity, placeFromCoordinates, placeRoute} from "@/helpers/place";

const LOCATE_TIMEOUT_MS = 10_000;
const CITY_RADIUS_KM = 15;

/**
 * "Use my location": asks the browser for the position and opens it. Inside a built-in city it opens that city
 * (translated name, favourites line up); anywhere else it opens the raw coordinates as "My location".
 */
export const useGeolocation = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [isLocating, setIsLocating] = useState(false);
    const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

    const locate = () => {
        if (!isSupported || isLocating) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({coords}) => {
                setIsLocating(false);
                const city = matchingCity(coords, CITY_RADIUS_KM);
                const place = city ? placeFromCity(city) : placeFromCoordinates(coords.latitude, coords.longitude, t("search.myLocation"));
                void navigate(placeRoute(place), {viewTransition: true});
            },
            () => {
                setIsLocating(false);
                toast.error(t("search.locationDenied"));
            },
            {timeout: LOCATE_TIMEOUT_MS, maximumAge: 10 * 60_000},
        );
    };

    return {locate, isLocating, isSupported};
};
