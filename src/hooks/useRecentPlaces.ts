import {STORAGE_KEYS} from "@/constants/storage";
import {createPlaceStore} from "@/hooks/_shared/createPlaceStore";

const recentStore = createPlaceStore(STORAGE_KEYS.RECENT, 5);

/** The last few places the visitor opened, newest first; the search box offers them before anything is typed. */
export const useRecentPlaces = () => ({recentPlaces: recentStore.useList(), rememberPlace: recentStore.promote});
