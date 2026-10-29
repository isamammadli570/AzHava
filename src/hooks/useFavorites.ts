import {useCallback} from "react";
import {STORAGE_KEYS} from "@/constants/storage";
import type {Place} from "@/helpers/place";
import {createPlaceStore} from "@/hooks/_shared/createPlaceStore";

const favoritesStore = createPlaceStore(STORAGE_KEYS.FAVORITES, 12);

/** Favourite places kept in localStorage and shared live between every component (and open tabs). */
export const useFavorites = () => {
    const favorites = favoritesStore.useList();

    const isFavorite = useCallback((placeId: string) => favorites.some((place) => place.id === placeId), [favorites]);

    /** Adds or removes the place; returns true when it ended up in the list. */
    const toggleFavorite = useCallback((place: Place): boolean => {
        const exists = favoritesStore.get().some((item) => item.id === place.id);
        if (exists) favoritesStore.remove(place.id);
        else favoritesStore.promote(place);
        return !exists;
    }, []);

    return {favorites, isFavorite, toggleFavorite};
};
