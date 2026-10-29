import {memo, type CSSProperties} from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";
import type {CurrentSnapshotResponse} from "@/api/forecast.api";
import {ROUTES} from "@/constants/routes";
import {formatClock} from "@/helpers/dates";
import {formatTemp} from "@/helpers/format";
import {placeRoute, type Place} from "@/helpers/place";
import {sceneFor, skyClass, weatherLabelKey} from "@/helpers/weather";
import {preloadRoute} from "@/router/preload";
import {Skeleton} from "@/components/ui/skeleton";
import {WeatherIcon} from "@/widgets/WeatherIcon";
import {cn} from "@/lib/utils";

type CityTileProps = {
    place: Place;
    name: string;
    country?: string;
    snapshot: CurrentSnapshotResponse | undefined;
    now: number;
    locale: string;
    /** Called when the pointer or focus lands on the tile, to warm the city's forecast. */
    onIntent: (place: Place) => void;
    style?: CSSProperties;
};

/** A small window onto each city's sky: its own gradient, icon, temperature and local time. */
export const CityTile = memo(({place, name, country, snapshot, now, locale, onIntent, style}: CityTileProps) => {
    const {t} = useTranslation("weather");
    const current = snapshot?.current;
    const isDay = current?.is_day === 1;
    const showIntent = () => {
        preloadRoute(ROUTES.CITY);
        onIntent(place);
    };

    return (
        <li style={style}>
            <Link
                to={placeRoute(place)}
                onPointerEnter={showIntent}
                onFocus={showIntent}
                className="spotlight group flex h-full min-h-40 flex-col overflow-hidden rounded-3xl border border-glass-border p-4 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.7)] transition-[translate,box-shadow,scale] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-20px_rgb(0_0_0/0.7)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
                <span aria-hidden className={cn("absolute inset-0 transition-transform duration-700 group-hover:scale-110", current ? skyClass(sceneFor(current.weather_code, isDay)) : "sky-clear-night")}/>
                <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/35"/>
                {/* Name on its own row at full width, so long names like "Mingəçevir" fit on a phone. */}
                <span className="relative min-w-0">
                    <span className="block truncate font-display text-lg font-bold text-shadow-soft">{name}</span>
                    <span className="block truncate text-xs text-white/75">
                        {[country, snapshot && formatClock(now, snapshot.timezone, locale)].filter(Boolean).join(" · ")}
                    </span>
                </span>
                <span className="relative mt-auto flex items-end justify-between gap-2 pt-3">
                    {current ? (
                        <>
                            <span className="min-w-0">
                                <span className="block font-display text-4xl font-light tracking-tight tabular text-shadow-soft">{formatTemp(current.temperature_2m)}</span>
                                <span className="block truncate text-xs font-medium text-white/80">{t(weatherLabelKey(current.weather_code))}</span>
                            </span>
                            <WeatherIcon code={current.weather_code} isDay={isDay} size={44} isAnimated={false} className="mb-1 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"/>
                        </>
                    ) : (
                        <Skeleton className="h-10 w-16"/>
                    )}
                </span>
            </Link>
        </li>
    );
});
