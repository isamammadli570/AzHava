import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent} from "react";
import {useNavigate} from "react-router";
import {History, Loader2, LocateFixed, MapPin, Search, X} from "lucide-react";
import {useTranslation} from "react-i18next";
import {CITIES} from "@/constants/cities";
import {SEARCH_MIN_LENGTH} from "@/constants/other";
import {placeFromCity, placeRoute, type Place} from "@/helpers/place";
import {matchesSearch} from "@/helpers/search";
import {useSearchPlaces} from "@/hooks/geocoding";
import {usePrefetchForecast} from "@/hooks/forecast";
import {useGeolocation} from "@/hooks/useGeolocation";
import {useHotkey} from "@/hooks/useHotkey";
import {useRecentPlaces} from "@/hooks/useRecentPlaces";
import {usePlaceLabel} from "@/hooks/usePlaceLabel";
import {preloadRoute} from "@/router/preload";
import {ROUTES} from "@/constants/routes";
import {cn} from "@/lib/utils";

const BUILT_IN_PLACES = CITIES.map(placeFromCity);
const BUILT_IN_LIMIT = 6;
const NO_PLACES: Place[] = [];

type PlaceSearchProps = {className?: string};

/**
 * Header combobox: built-in cities match instantly (diacritics-insensitive, in every language), and the worldwide
 * geocoding results follow once the user stops typing. Fully keyboard-driven; "/" focuses it from anywhere.
 */
export const PlaceSearch = ({className}: PlaceSearchProps) => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {placeName, countryName} = usePlaceLabel();
    const [term, setTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const listId = useId();
    const {places: remotePlaces, isSearching, isPending} = useSearchPlaces(term);
    const {recentPlaces} = useRecentPlaces();
    const {locate, isLocating, isSupported: canLocate} = useGeolocation();
    const prefetchForecast = usePrefetchForecast();

    // With nothing typed, recently viewed places come first; typing hides them and searches everything.
    const shownRecent = term.trim() ? NO_PLACES : recentPlaces;

    const localPlaces = useMemo(() => {
        const query = term.trim();
        const recentIds = new Set(shownRecent.map((place) => place.id));
        // Match the translated name and the id, so "Baku" still finds Bakı while the UI is in Azerbaijani.
        return BUILT_IN_PLACES.filter((place) => !recentIds.has(place.id) && (matchesSearch(placeName(place), query) || matchesSearch(place.cityId ?? "", query))).slice(0, query ? BUILT_IN_LIMIT : 8);
    }, [term, placeName, shownRecent]);

    const options = useMemo(() => [...shownRecent, ...localPlaces, ...remotePlaces], [shownRecent, localPlaces, remotePlaces]);

    // Warm the forecast of whatever is highlighted, so Enter opens it without a loading state.
    const highlighted = isOpen ? options[activeIndex] : undefined;
    useEffect(() => {
        if (!highlighted) return;
        const timer = window.setTimeout(() => prefetchForecast(highlighted), 250);
        return () => window.clearTimeout(timer);
    }, [highlighted, prefetchForecast]);
    const trimmed = term.trim();
    const isTooShort = trimmed.length > 0 && trimmed.length < SEARCH_MIN_LENGTH;
    const isLoading = isSearching || (isPending && trimmed.length >= SEARCH_MIN_LENGTH);
    const isEmpty = options.length === 0 && !isLoading && trimmed.length >= SEARCH_MIN_LENGTH;

    useHotkey("/", () => inputRef.current?.focus());

    useEffect(() => {
        if (!isOpen) return;
        const closeOutside = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
    }, [isOpen]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({block: "nearest"});
    }, [activeIndex]);

    const choose = (place: Place) => {
        setTerm("");
        setIsOpen(false);
        inputRef.current?.blur();
        void navigate(placeRoute(place));
    };

    const moveActive = (step: number) => {
        if (options.length === 0) return;
        setIsOpen(true);
        setActiveIndex((index) => (index + step + options.length) % options.length);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
        } else if (event.key === "Enter" && isOpen && options[activeIndex]) {
            event.preventDefault();
            choose(options[activeIndex]);
        } else if (event.key === "Escape") {
            if (term) setTerm("");
            else {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        }
    };

    const renderOption = (place: Place, index: number, isRecent = false) => {
        const isActive = index === activeIndex;
        const Icon = isRecent ? History : MapPin;
        const country = countryName(place);
        const subtitle = [place.admin, country].filter(Boolean).join(", ");
        return (
            <li
                key={place.id}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isActive}
                onPointerEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(place)}
                className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-(--duration-fast)",
                    isActive ? "bg-white/12" : "hover:bg-glass-hover",
                )}
            >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-transform duration-(--duration-fast)", isActive && "scale-110", isRecent ? "bg-white/10 text-muted-foreground" : place.cityId ? "bg-brand-soft text-brand" : "bg-accent-soft text-accent")}>
                    <Icon className="size-4"/>
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{placeName(place)}</span>
                    {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
                </span>
            </li>
        );
    };

    return (
        <div ref={rootRef} className={cn("relative", className)}>
            <div className="glass flex h-11 items-center gap-2.5 rounded-full pr-1.5 pl-4 transition-shadow duration-(--duration-base) focus-within:ring-2 focus-within:ring-ring/70">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden/>
                <input
                    ref={inputRef}
                    type="search"
                    role="combobox"
                    value={term}
                    placeholder={t("search.placeholder")}
                    aria-label={t("search.label")}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={isOpen && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => {
                        setTerm(event.target.value);
                        setActiveIndex(0);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        preloadRoute(ROUTES.CITY);
                    }}
                    onKeyDown={onKeyDown}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
                />
                {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden/>}
                {canLocate && !term && (
                    <button
                        type="button"
                        onClick={locate}
                        disabled={isLocating}
                        aria-label={isLocating ? t("search.locating") : t("search.locate")}
                        title={t("search.locate")}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-brand transition-[background-color,scale] duration-(--duration-fast) hover:bg-brand-soft active:scale-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-70"
                    >
                        <LocateFixed className={cn("size-4", isLocating && "animate-spin [animation-duration:1.4s]")}/>
                    </button>
                )}
                {term ? (
                    <button
                        type="button"
                        aria-label={t("search.clear")}
                        onClick={() => {
                            setTerm("");
                            inputRef.current?.focus();
                        }}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <X className="size-4"/>
                    </button>
                ) : (
                    <kbd className="mr-2 hidden h-6 min-w-6 place-items-center rounded-md border border-glass-border px-1.5 text-[11px] text-muted-foreground sm:grid">/</kbd>
                )}
            </div>

            {isOpen && (
                // Solid rather than glass: results must stay readable over a busy page and any sky.
                <div className="absolute inset-x-0 top-full z-50 mt-2 animate-scale-in overflow-hidden rounded-2xl border border-glass-border bg-surface p-1.5 shadow-2xl [transform-origin:top]">
                    <ul ref={listRef} id={listId} role="listbox" aria-label={t("search.label")} className="max-h-[min(26rem,65vh)] overflow-y-auto overscroll-contain">
                        {shownRecent.length > 0 && <li role="presentation" className="section-label px-3 pt-2 pb-1">{t("search.recent")}</li>}
                        {shownRecent.map((place, index) => renderOption(place, index, true))}
                        {localPlaces.length > 0 && <li role="presentation" className="section-label px-3 pt-3 pb-1">{t("search.builtIn")}</li>}
                        {localPlaces.map((place, index) => renderOption(place, shownRecent.length + index))}
                        {remotePlaces.length > 0 && <li role="presentation" className="section-label px-3 pt-3 pb-1">{t("search.results")}</li>}
                        {remotePlaces.map((place, index) => renderOption(place, shownRecent.length + localPlaces.length + index))}
                        {isTooShort && localPlaces.length === 0 && <li role="presentation" className="px-3 py-4 text-center text-sm text-muted-foreground">{t("search.hint")}</li>}
                        {isLoading && remotePlaces.length === 0 && <li role="presentation" className="px-3 py-3 text-sm text-muted-foreground">{t("search.loading")}</li>}
                        {isEmpty && <li role="presentation" className="px-3 py-4 text-center text-sm text-muted-foreground">{t("search.empty")}</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};
