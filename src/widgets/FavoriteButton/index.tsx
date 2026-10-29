import {useState, type CSSProperties} from "react";
import {Star} from "lucide-react";
import {useTranslation} from "react-i18next";
import {toast} from "sonner";
import type {Place} from "@/helpers/place";
import {useFavorites} from "@/hooks/useFavorites";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

const BURST = Array.from({length: 8}, (_, index) => {
    const angle = (index / 8) * Math.PI * 2;
    return {angle, dx: Math.round(Math.cos(angle) * 22), dy: Math.round(Math.sin(angle) * 22)};
});

type FavoriteButtonProps = {place: Place; className?: string};

/** Star toggle that saves the place to favourites, with a little pop when pressed. */
export const FavoriteButton = ({place, className}: FavoriteButtonProps) => {
    const {t} = useTranslation();
    const {isFavorite, toggleFavorite} = useFavorites();
    const {placeName} = usePlaceLabel();
    const [pops, setPops] = useState(0);
    const isActive = isFavorite(place.id);
    const label = t(isActive ? "favorites.remove" : "favorites.add");

    const toggle = () => {
        const isAdded = toggleFavorite(place);
        setPops((count) => count + 1);
        toast.success(t(isAdded ? "favorites.added" : "favorites.removed", {name: placeName(place)}));
    };

    return (
        <Button variant="glass" size="icon" aria-label={label} title={label} aria-pressed={isActive} onClick={toggle} className={cn("relative overflow-visible", className)}>
            <Star
                key={pops}
                className={cn("size-5 transition-colors duration-(--duration-base)", pops > 0 && "animate-pop", isActive ? "fill-brand text-brand" : "text-foreground")}
            />
            {/* A small burst of sparks when a place is starred. */}
            {isActive && pops > 0 && (
                <span key={`burst-${pops}`} aria-hidden className="pointer-events-none absolute inset-0">
                    {BURST.map((spark) => (
                        <span
                            key={spark.angle}
                            className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-brand animate-[burst_600ms_var(--ease-out)_both]"
                            style={{"--dx": `${spark.dx}px`, "--dy": `${spark.dy}px`} as CSSProperties}
                        />
                    ))}
                </span>
            )}
        </Button>
    );
};
