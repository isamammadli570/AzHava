import {useEffect, useState} from "react";
import {nowSeconds} from "@/helpers/dates";

/** Current unix time in seconds, refreshed on an interval so clocks and the sun position keep moving. */
export const useNow = (intervalMs = 30_000): number => {
    const [now, setNow] = useState(nowSeconds);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(nowSeconds()), intervalMs);
        return () => window.clearInterval(timer);
    }, [intervalMs]);

    return now;
};
