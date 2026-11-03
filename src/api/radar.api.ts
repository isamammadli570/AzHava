import axios from "axios";
import {normalizeApiError} from "@/api/client";

const RAINVIEWER_MAPS = "https://api.rainviewer.com/public/weather-maps.json";

export type RadarFrame = {time: number; path: string};

type WeatherMaps = {host: string; radar: {past: RadarFrame[]; nowcast?: RadarFrame[]}};

export type RadarFrames = {host: string; frames: RadarFrame[]};

/** The last ~2 hours of radar frames (10-minute steps) from RainViewer: free, keyless, CORS-enabled. */
export const getRadarFrames = async (): Promise<RadarFrames> => {
    try {
        const {data} = await axios.get<WeatherMaps>(RAINVIEWER_MAPS, {timeout: 10_000});
        return {host: data.host, frames: data.radar.past};
    } catch (error) {
        throw normalizeApiError(error);
    }
};

/** Tile URL of one radar frame: 256 px tiles, colour scheme 2 ("universal blue"), smoothed, snow shown. */
export const radarTileUrl = (host: string, frame: RadarFrame): string => `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
