import {Star} from "lucide-react";
import {NavLink} from "react-router";
import {useTranslation} from "react-i18next";
import {formatTemp} from "@/helpers/format";
import {placeRoute} from "@/helpers/place";
import {useGetCurrentBatch, usePrefetchForecast} from "@/hooks/forecast";
import {useFavorites} from "@/hooks/useFavorites";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {WeatherIcon} from "@/widgets/WeatherIcon";
import {cn, staggerIndex} from "@/lib/utils";

/** Quick switcher between favourite places with their current temperature. Hidden until something is starred. */
export const FavoritesStrip = () => {
    const {t} = useTranslation();
    const {favorites} = useFavorites();
    const {placeName} = usePlaceLabel();
    const {byPlaceId} = useGetCurrentBatch(favorites);
    const prefetchForecast = usePrefetchForecast();

    if (favorites.length === 0) return null;

    return (
        <nav aria-label={t("favorites.title")} className="mask-fade-x scrollbar-none -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="stagger flex w-max gap-2 py-1">
                <li className="flex items-center pr-1 text-brand" aria-hidden>
                    <Star className="size-4 fill-current"/>
                </li>
                {favorites.map((place, index) => {
                    const snapshot = byPlaceId.get(place.id)?.current;
                    return (
                        <li key={place.id} style={staggerIndex(index)}>
                            <NavLink
                                to={placeRoute(place)}
                                onPointerEnter={() => prefetchForecast(place)}
                                className={({isActive}) =>
                                    cn(
                                        "flex h-10 items-center gap-2 rounded-full pr-3.5 pl-2 text-sm font-medium transition-colors duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                        isActive ? "bg-white/90 text-slate-900 hover:bg-white" : "glass hover:bg-glass-hover",
                                    )
                                }
                            >
                                {snapshot ? <WeatherIcon code={snapshot.weather_code} isDay={snapshot.is_day === 1} size={26} isAnimated={false}/> : <span className="size-[26px]"/>}
                                <span className="max-w-36 truncate">{placeName(place)}</span>
                                <span className="font-semibold tabular">{formatTemp(snapshot?.temperature_2m)}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
