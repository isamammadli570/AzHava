import {redirect} from "react-router";
import {DEFAULT_CITY_ID} from "@/constants/cities";
import {buildRoute} from "@/constants/routes";
import {STORAGE_KEYS} from "@/constants/storage";
import {storageGet} from "@/lib/localStorage";

/** "/" reopens the place the visitor looked at last; first-timers get Baku. */
export const redirectToLastPlace = () => {
    const last = storageGet(STORAGE_KEYS.LAST_PLACE);
    const isSafe = last !== null && (last.startsWith("/city/") || last.startsWith("/place/"));
    return redirect(isSafe ? last : buildRoute.city(DEFAULT_CITY_ID));
};
