import {memo, type CSSProperties} from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";
import type {CurrentSnapshotResponse} from "@/api/forecast.api";
import {ROUTES} from "@/constants/routes";
import {formatClock} from "@/helpers/dates";
import {formatTemp} from "@/helpers/format";
import {placeRoute, type Place} from "@/helpers/place";
import {weatherLabelKey} from "@/helpers/weather";
import {preloadRoute} from "@/router/preload";
import {Skeleton} from "@/components/ui/skeleton";
import {WeatherGlyph} from "@/widgets/WeatherGlyph";

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

/** One city at a glance on night glass: name, local time, temperature in hairline type and an outline symbol. */
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
                className="glass spotlight group flex h-full min-h-40 flex-col overflow-hidden rounded-[1.375rem] p-4 transition-[translate,box-shadow,scale] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-20px_rgb(0_0_0/0.7)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
                {/* Name on its own row at full width, so long names like "Mingəçevir" fit on a phone. */}
                <span className="relative min-w-0">
                    <span className="block truncate text-[12px] font-light tracking-[0.28em] uppercase">{name}</span>
                    <span className="mt-1 block truncate text-[10px] font-light tracking-[0.12em] text-subtle-foreground">
                        {[country, snapshot && formatClock(now, snapshot.timezone, locale)].filter(Boolean).join(" · ")}
                    </span>
                </span>
                <span className="relative mt-auto flex items-end justify-between gap-2 pt-3">
                    {current ? (
                        <>
                            <span className="min-w-0">
                                <span className="block text-[2.5rem] leading-none font-extralight tracking-tight tabular">{formatTemp(current.temperature_2m)}</span>
                                <span className="block truncate text-[10px] font-light tracking-[0.22em] text-muted-foreground uppercase">{t(weatherLabelKey(current.weather_code))}</span>
                            </span>
                            <WeatherGlyph code={current.weather_code} isDay={isDay} size={30} strokeWidth={1} className="mb-1.5 text-muted-foreground transition-[scale,rotate,color] duration-500 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-brand"/>
                        </>
                    ) : (
                        <Skeleton className="h-10 w-16"/>
                    )}
                </span>
            </Link>
        </li>
    );
});
