import {useSyncExternalStore} from "react";

const subscribe = (onChange: () => void) => {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
    };
};

/** Whether the browser thinks it is online; flips live when the connection drops or returns. */
export const useOnlineStatus = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
