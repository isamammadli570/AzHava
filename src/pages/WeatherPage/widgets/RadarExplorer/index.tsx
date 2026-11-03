import {useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode} from "react";
import type L from "leaflet";
import {Layers, List, Navigation, Pause, Play} from "lucide-react";
import {Dialog} from "radix-ui";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {RADAR_GRADIENT} from "@/api/radar.api";
import type {CurrentWeather} from "@/api/forecast.api";
import {temperatureColor} from "@/helpers/color";
import {formatClock, formatFullDate} from "@/helpers/dates";
import {beaufortColor} from "@/helpers/detail";
import {placeRoute, type Place} from "@/helpers/place";
import {useGetCurrentBatch, useGetGridWeather} from "@/hooks/forecast";
import {useGetRadarFrames} from "@/hooks/radar";
import {useFavorites} from "@/hooks/useFavorites";
import {useLanguage} from "@/hooks/useLanguage";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {useReducedMotion} from "@/hooks/useReducedMotion";
import {DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";
import {createRadarLayers, createWeatherMap} from "@/widgets/WeatherMap/mapKit";
import {MapPins, type MapPin} from "@/widgets/WeatherMap/MapPins";
import {PlacePin, TemperatureChip, WindChip} from "@/widgets/WeatherMap/pins";

const LAYERS = ["precipitation", "temperature", "wind"] as const;
type MapLayer = (typeof LAYERS)[number];

const FRAME_MS = 650;
const LAST_FRAME_HOLD_MS = 1600;
/** Grid readings sit about this far apart on screen (px). */
const GRID_SPACING = 96;
const PLACE_ZOOM = 7;

type Point = {latitude: number; longitude: number};

/** Evenly spaced points over what the map shows, for the temperature and wind layers. */
const gridPoints = (map: L.Map): Point[] => {
    const size = map.getSize();
    const columns = Math.max(3, Math.round(size.x / GRID_SPACING));
    const rows = Math.max(4, Math.round(size.y / GRID_SPACING));
    const points: Point[] = [];
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const {lat, lng} = map.containerPointToLatLng([((column + 0.5) * size.x) / columns, ((row + 0.5) * size.y) / rows]);
            points.push({latitude: Math.round(lat * 100) / 100, longitude: Math.round((((lng + 180) % 360) + 360) % 360 * 100) / 100 - 180});
        }
    }
    return points;
};

/** Frosted dark glass for the map's floating controls. */
const GLASS = "border border-white/10 bg-[rgb(28_32_42/0.72)] shadow-[0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-xl";

const ControlButton = ({label, onClick, children}: {label: string; onClick?: () => void; children: ReactNode}) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className="grid size-11 place-items-center text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&_svg]:size-5"
    >
        {children}
    </button>
);

type LegendProps = {title: string; gradient: string[]; labels: string[]};

/** The colour key, like iOS: a vertical colour bar beside its labels, strongest at the top. */
const Legend = ({title, gradient, labels}: LegendProps) => (
    <div className={cn(GLASS, "w-32 rounded-2xl px-3 py-2.5")}>
        <p className="mb-2 text-[13px] font-semibold text-white">{title}</p>
        <div className="flex gap-2.5">
            <span className="w-1 rounded-full" style={{background: `linear-gradient(to top, ${gradient.join(", ")})`}}/>
            <ul className="flex flex-1 flex-col justify-between gap-2.5 text-[12px] text-white/70">
                {labels.map((label) => <li key={label}>{label}</li>)}
            </ul>
        </div>
    </div>
);

type RadarExplorerProps = {open: boolean; onClose: () => void; place: Place; current: CurrentWeather; timezone: string};

/**
 * The full weather map, like iOS Weather's but with three layers: animated rain radar with a timeline, temperatures
 * and winds over whatever area is shown (refetched when the map stops moving). Pan, pinch, wheel or double-tap to
 * explore; saved places appear as live temperature bubbles and open on tap; the arrow finds you, the list jumps to a
 * saved place. Loaded on demand with the map library.
 */
const RadarExplorer = ({open, onClose, place, current, timezone}: RadarExplorerProps) => {
    const {t} = useTranslation(["weather", "common"]);
    const {locale} = useLanguage();
    const {placeName} = usePlaceLabel();
    const navigate = useNavigate();
    const isReduced = useReducedMotion();
    // A callback ref: the dialog renders its content a moment after mounting, so the map waits for the element.
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const radarRef = useRef<ReturnType<typeof createRadarLayers> | null>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const [layer, setLayer] = useState<MapLayer>("precipitation");
    const [frameIndex, setFrameIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [points, setPoints] = useState<Point[]>([]);
    const [userPosition, setUserPosition] = useState<Point | null>(null);
    const radar = useGetRadarFrames(true);
    const frames = radar.data?.frames ?? [];
    const lastIndex = Math.max(0, frames.length - 1);
    const shownIndex = frameIndex ?? lastIndex;
    const {favorites} = useFavorites();
    const others = useMemo(() => favorites.filter((favorite) => favorite.id !== place.id), [favorites, place.id]);
    const batch = useGetCurrentBatch(others);
    const grid = useGetGridWeather(points, layer !== "precipitation");

    // Build the map once the dialog content is in the page; resize it once the opening animation has settled.
    useEffect(() => {
        if (!container) return;
        const created = createWeatherMap(container, {latitude: place.latitude, longitude: place.longitude, zoom: 6, isInteractive: true});
        let isLive = true;
        const settle = window.setTimeout(() => created.map.invalidateSize(), 420);
        void created.ready.then(() => {
            if (!isLive) return;
            radarRef.current = createRadarLayers(created.map);
            setMap(created.map);
            setPoints(gridPoints(created.map));
        });
        const onMoveEnd = () => setPoints(gridPoints(created.map));
        created.map.on("moveend", onMoveEnd);
        return () => {
            isLive = false;
            globalThis.clearTimeout(settle);
            created.map.off("moveend", onMoveEnd);
            created.map.remove();
            radarRef.current = null;
            setMap(null);
        };
        // The map is built once per opening; the place does not change while it is open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container]);

    useEffect(() => {
        if (!map || !radarRef.current || !radar.data) return;
        radarRef.current.setFrames(radar.data);
        radarRef.current.show(layer === "precipitation" ? shownIndex : null);
    }, [map, radar.data, shownIndex, layer]);

    const isAnimating = isPlaying && !isReduced && layer === "precipitation" && frames.length > 1;
    useEffect(() => {
        if (!isAnimating) return;
        const timer = window.setTimeout(
            () => setFrameIndex((index) => ((index ?? lastIndex) + 1) % frames.length),
            shownIndex === lastIndex ? LAST_FRAME_HOLD_MS : FRAME_MS,
        );
        return () => globalThis.clearTimeout(timer);
    }, [isAnimating, shownIndex, lastIndex, frames.length]);

    const flyTo = useCallback((target: Point, zoom = PLACE_ZOOM) => map?.flyTo([target.latitude, target.longitude], zoom, {duration: 0.9}), [map]);
    const locate = () => {
        if (!("geolocation" in navigator)) {
            flyTo(place);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({coords}) => {
                const position = {latitude: coords.latitude, longitude: coords.longitude};
                setUserPosition(position);
                flyTo(position, 8);
            },
            () => flyTo(place),
            {timeout: 10_000, maximumAge: 300_000},
        );
    };

    const pins = useMemo<MapPin[]>(() => {
        const list: MapPin[] = [];
        if (layer === "temperature") {
            grid.data?.forEach((point, index) => list.push({id: `grid-${index}`, latitude: point.latitude, longitude: point.longitude, content: <TemperatureChip temperature={point.temperature}/>}));
        } else if (layer === "wind") {
            grid.data?.forEach((point, index) => list.push({id: `grid-${index}`, latitude: point.latitude, longitude: point.longitude, content: <WindChip speed={point.windSpeed} direction={point.windDirection}/>}));
        }
        others.forEach((favorite) => {
            const snapshot = batch.byPlaceId.get(favorite.id)?.current;
            list.push({
                id: `place-${favorite.id}`,
                latitude: favorite.latitude,
                longitude: favorite.longitude,
                content: <PlacePin temperature={snapshot?.temperature_2m ?? null} weatherCode={snapshot?.weather_code} isDay={snapshot?.is_day !== 0} name={placeName(favorite)}/>,
                onSelect: () => void navigate(placeRoute(favorite), {replace: true}),
            });
        });
        if (userPosition) {
            list.push({id: "me", latitude: userPosition.latitude, longitude: userPosition.longitude, isOnTop: true, content: <span className="map-user-dot"/>});
        }
        list.push({
            id: "place",
            latitude: place.latitude,
            longitude: place.longitude,
            isOnTop: true,
            content: <PlacePin temperature={current.temperature_2m} weatherCode={current.weather_code} isDay={current.is_day === 1} name={placeName(place)} isCurrent/>,
        });
        return list;
    }, [layer, grid.data, others, batch.byPlaceId, userPosition, place, current, placeName, navigate]);

    const legend: LegendProps =
        layer === "precipitation"
            ? {title: t("radar.layer.precipitation"), gradient: RADAR_GRADIENT, labels: [t("radar.levels.extreme"), t("radar.levels.heavy"), t("radar.levels.moderate"), t("radar.levels.light")]}
            : layer === "temperature"
              ? {title: t("radar.layer.temperature"), gradient: [-20, -5, 5, 13, 20, 28, 38].map(temperatureColor), labels: ["35°", "20°", "5°", "−15°"]}
              : {title: t("radar.layer.wind"), gradient: [0, 2, 4, 6, 8, 10, 12].map(beaufortColor), labels: [`100+ ${t("details.kmh")}`, "50", "20", "0"]};

    const frameTime = frames[shownIndex]?.time;
    const now = current.time;

    return (
        <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
            <Dialog.Portal>
                <Dialog.Content aria-describedby={undefined} className="map-screen fixed inset-0 z-50 overflow-hidden bg-[#2b2e33] outline-none">
                    <Dialog.Title className="sr-only">{t("radar.mapTitle")}</Dialog.Title>
                    {/* Isolated: Leaflet's own layers (z-index 400+) stay under the floating controls. */}
                    <div ref={setContainer} className="absolute inset-0 isolate"/>
                    {map && <MapPins map={map} pins={pins}/>}

                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="pointer-events-auto flex flex-col gap-3">
                                <Dialog.Close className={cn(GLASS, "h-11 rounded-2xl px-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>
                                    {t("radar.done")}
                                </Dialog.Close>
                                <Legend {...legend}/>
                            </div>
                            <div className="pointer-events-auto flex flex-col gap-3">
                                <div className={cn(GLASS, "flex flex-col divide-y divide-white/10 overflow-hidden rounded-2xl")}>
                                    <ControlButton label={t("radar.locate")} onClick={locate}>
                                        <Navigation/>
                                    </ControlButton>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button type="button" aria-label={t("radar.places")} title={t("radar.places")} className="grid size-11 place-items-center text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                                <List className="size-5"/>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="z-[60] max-h-80 overflow-y-auto">
                                            <DropdownMenuLabel>{t("radar.places")}</DropdownMenuLabel>
                                            <DropdownMenuRadioGroup value="" onValueChange={(id) => flyTo([place, ...others].find((item) => item.id === id) ?? place)}>
                                                {[place, ...others].map((item) => (
                                                    <DropdownMenuRadioItem key={item.id} value={item.id}>{placeName(item)}</DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button type="button" aria-label={t("radar.layers")} title={t("radar.layers")} className={cn(GLASS, "grid size-11 place-items-center rounded-2xl text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>
                                            <Layers className="size-5"/>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[60]">
                                        <DropdownMenuLabel>{t("radar.layers")}</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={layer} onValueChange={(value) => setLayer(value as MapLayer)}>
                                            {LAYERS.map((item) => (
                                                <DropdownMenuRadioItem key={item} value={item}>{t(`radar.layer.${item}`)}</DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* The timeline: play the last two hours, or drag through them. Other layers show "now". */}
                        <div className={cn(GLASS, "pointer-events-auto mx-auto w-full max-w-xl rounded-3xl px-4 pt-3 pb-3.5")}>
                            {layer === "precipitation" && frames.length > 1 ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsPlaying((playing) => !playing)}
                                            aria-label={isAnimating ? t("radar.pause") : t("radar.play")}
                                            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            {isAnimating ? <Pause className="size-4 fill-current"/> : <Play className="size-4 translate-x-px fill-current"/>}
                                        </button>
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-semibold text-white">{t("radar.past2h")}</p>
                                            <p className="truncate text-[12px] text-white/60 first-letter:uppercase">
                                                {frameTime ? `${formatFullDate(frameTime, timezone, locale)} · ${formatClock(frameTime, timezone, locale)}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={lastIndex}
                                        step={1}
                                        value={shownIndex}
                                        onChange={(event) => {
                                            setIsPlaying(false);
                                            setFrameIndex(Number(event.target.value));
                                        }}
                                        aria-label={t("radar.timeline")}
                                        aria-valuetext={frameTime ? formatClock(frameTime, timezone, locale) : undefined}
                                        className="map-range mt-3 w-full"
                                        style={{"--progress": `${(shownIndex / Math.max(1, lastIndex)) * 100}%`} as CSSProperties}
                                    />
                                    <div aria-hidden className="relative mt-1.5 h-4 text-[11px] text-white/55 tabular">
                                        {frames.map((frame, index) =>
                                            index % 3 === 0 || index === lastIndex ? (
                                                <span
                                                    key={frame.time}
                                                    className={cn("absolute -translate-x-1/2 whitespace-nowrap", index === lastIndex && "font-semibold text-white", index === shownIndex && "text-white")}
                                                    style={{left: `${(index / Math.max(1, lastIndex)) * 100}%`}}
                                                >
                                                    {index === lastIndex ? t("radar.now") : formatClock(frame.time, timezone, locale)}
                                                </span>
                                            ) : null,
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-[15px] font-semibold text-white">{layer === "precipitation" ? t("radar.layer.precipitation") : t(`radar.currentLayer.${layer}`)}</p>
                                    <p className="text-[12px] text-white/60 first-letter:uppercase">
                                        {radar.isError && layer === "precipitation" ? t("radar.unavailable") : `${formatFullDate(now, timezone, locale)} · ${formatClock(now, timezone, locale)}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default RadarExplorer;
