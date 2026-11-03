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

/** RainViewer colour scheme 8 ("Dark Sky"): light blue through purple and red to yellow, the palette iOS Weather uses. */
const COLOR_SCHEME = 8;

/** Tile URL of one radar frame: 256 px tiles, the Dark Sky colours, smoothed, snow shown. */
export const radarTileUrl = (host: string, frame: RadarFrame): string => `${host}${frame.path}/256/{z}/{x}/{y}/${COLOR_SCHEME}/1_1.png`;

/** The radar legend, light to extreme, matching the Dark Sky colours of the tiles. */
export const RADAR_GRADIENT = ["#4a8dff", "#5f63ff", "#9b4dff", "#e2479b", "#ff7a3d", "#ffd84a"];
