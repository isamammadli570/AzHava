import {useQuery} from "@tanstack/react-query";
import {getRadarFrames} from "@/api/radar.api";
import {QUERY_KEYS} from "@/constants/other";

const RADAR_STALE_TIME = 5 * 60_000;

/** Radar frame list; quiet on failure (the card shows its own "unavailable" line). Only fetched once enabled. */
export const useGetRadarFrames = (isEnabled: boolean) =>
    useQuery({
        queryKey: [QUERY_KEYS.RADAR],
        queryFn: getRadarFrames,
        enabled: isEnabled,
        staleTime: RADAR_STALE_TIME,
        refetchInterval: RADAR_STALE_TIME,
        meta: {suppressGlobalError: true},
    });
