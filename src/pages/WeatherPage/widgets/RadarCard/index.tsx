import {lazy, Suspense, useEffect, useRef, useState, type CSSProperties} from "react";
import {Maximize2, Pause, Play, Umbrella} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useGetRadarFrames} from "@/hooks/radar";
import {useOpenSheet} from "@/hooks/useDetailSheet";
import {useReducedMotion} from "@/hooks/useReducedMotion";
import {Button} from "@/components/ui/button";
import {Card, CardHeader} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils";

const loadRadarMap = () => import("@/pages/WeatherPage/widgets/RadarCard/RadarMap");
const RadarMap = lazy(() => loadRadarMap().then((module) => ({default: module.RadarMap})));

/** Fetch and parse the map code while the browser is idle, so scrolling to the radar never pays for it. */
const prefetchWhenIdle = (): (() => void) => {
    if ("requestIdleCallback" in window) {
        // No timeout: a forced run could land in the middle of an interaction; truly idle time is enough.
        const handle = window.requestIdleCallback(() => void loadRadarMap());
        return () => window.cancelIdleCallback(handle);
    }
    const timer = globalThis.setTimeout(() => void loadRadarMap(), 2500);
    return () => globalThis.clearTimeout(timer);
};

const FRAME_MS = 600;
/** The last frame (now) is held a little longer, so each loop clearly ends on the present. */
const LAST_FRAME_HOLD_MS = 1500;

type RadarCardProps = {
    latitude: number;
    longitude: number;
    placeName: string;
    temperature: number;
    weatherCode: number;
    isDay: boolean;
    className?: string;
    style?: CSSProperties;
};

/**
 * Animated precipitation radar around the place, like the iOS rain card but playing the last two hours; tapping the
 * map opens the full, explorable map. Nothing (no map library, no tiles) loads until the card is about to scroll
 * into view, and the animation pauses whenever the card is off screen.
 */
export const RadarCard = ({latitude, longitude, placeName, temperature, weatherCode, isDay, className, style}: RadarCardProps) => {
    const {t} = useTranslation("weather");
    const openSheet = useOpenSheet();
    const cardRef = useRef<HTMLElement>(null);
    const [isNear, setIsNear] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const isReduced = useReducedMotion();
    const radar = useGetRadarFrames(isNear);
    const frames = radar.data?.frames ?? [];
    const [frameIndex, setFrameIndex] = useState<number | null>(null);
    const lastIndex = Math.max(0, frames.length - 1);
    const shownIndex = frameIndex ?? lastIndex;

    useEffect(prefetchWhenIdle, []);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                if (entry.isIntersecting) setIsNear(true);
            },
            {rootMargin: "300px 0px"},
        );
        observer.observe(card);
        return () => observer.disconnect();
    }, []);

    const isAnimating = isPlaying && isVisible && !isReduced && frames.length > 1;

    useEffect(() => {
        if (!isAnimating) return;
        const timer = window.setTimeout(
            () => setFrameIndex((index) => ((index ?? lastIndex) + 1) % frames.length),
            shownIndex === lastIndex ? LAST_FRAME_HOLD_MS : FRAME_MS,
        );
        return () => globalThis.clearTimeout(timer);
    }, [isAnimating, shownIndex, lastIndex, frames.length]);

    const frameTime = frames[shownIndex]?.time;
    const latestTime = frames[lastIndex]?.time;
    const minutesAgo = frameTime && latestTime ? Math.round((latestTime - frameTime) / 60) : 0;

    return (
        <Card ref={cardRef} aria-labelledby="radar-title" style={style} className={cn("[grid-area:radar]", className)}>
            <CardHeader
                id="radar-title"
                icon={<Umbrella/>}
                title={t("radar.title")}
                actions={
                    frames.length > 1 && (
                        <Button variant="ghost" size="icon-sm" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isAnimating ? t("radar.pause") : t("radar.play")}>
                            {isAnimating ? <Pause className="fill-current"/> : <Play className="fill-current"/>}
                        </Button>
                    )
                }
            />
            {/* The map is isolated, so Leaflet's own layering stays inside it (never above sheets or the header). */}
            <div className="relative isolate h-64 overflow-hidden rounded-2xl bg-[#1f2733] sm:h-80">
                {radar.isError ? (
                    <p className="grid size-full place-items-center px-6 text-center text-sm text-muted-foreground">{t("radar.unavailable")}</p>
                ) : radar.data ? (
                    <Suspense fallback={<Skeleton className="size-full rounded-none"/>}>
                        <RadarMap
                            latitude={latitude}
                            longitude={longitude}
                            placeName={placeName}
                            temperature={temperature}
                            weatherCode={weatherCode}
                            isDay={isDay}
                            radar={radar.data}
                            frameIndex={shownIndex}
                        />
                    </Suspense>
                ) : isNear ? (
                    <Skeleton className="size-full rounded-none"/>
                ) : null}

                {/* The whole map is one button that opens the full map. */}
                <button
                    type="button"
                    onClick={() => openSheet("radar")}
                    aria-label={t("radar.open")}
                    className="group absolute inset-0 z-[1000] rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    {frames.length > 1 && (
                        <span className="absolute top-3 left-3 rounded-full bg-[rgb(20_24_32/0.8)] px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md tabular">
                            {minutesAgo === 0 ? t("radar.now") : t("radar.ago", {minutes: minutesAgo})}
                        </span>
                    )}
                    <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-[rgb(20_24_32/0.8)] text-white backdrop-blur-md transition-transform duration-(--duration-base) group-hover:scale-110">
                        <Maximize2 className="size-3.5" strokeWidth={2}/>
                    </span>
                    {frames.length > 1 && (
                        <span aria-hidden className="absolute inset-x-3 bottom-7 flex gap-1">
                            {frames.map((frame, index) => (
                                <span key={frame.time} className={cn("h-1 flex-1 rounded-full transition-colors duration-200", index <= shownIndex ? "bg-white/85" : "bg-white/25")}/>
                            ))}
                        </span>
                    )}
                </button>
            </div>
        </Card>
    );
};
