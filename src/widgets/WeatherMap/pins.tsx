import {ArrowUp} from "lucide-react";
import {temperatureColor} from "@/helpers/color";
import {beaufortColor, beaufortForce} from "@/helpers/detail";
import {roundTemp} from "@/helpers/format";
import {cn} from "@/lib/utils";
import {WeatherGlyph} from "@/widgets/WeatherGlyph";

type PlacePinProps = {temperature: number | null; weatherCode?: number; isDay?: boolean; name: string; isCurrent?: boolean};

/**
 * A place on the map, like iOS: a dark round bubble with the temperature and sky, a dot where the place is and its
 * name under it. The place being viewed gets a soft pulse.
 */
export const PlacePin = ({temperature, weatherCode, isDay = true, name, isCurrent = false}: PlacePinProps) => (
    <div className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-[calc(100%-0.25rem)] flex-col items-center">
        <span
            className={cn(
                "relative grid size-12 place-items-center rounded-full border border-white/15 bg-[rgb(26_32_44/0.94)] shadow-[0_6px_18px_rgb(0_0_0/0.45)]",
                isCurrent && "map-pin-current size-14",
            )}
        >
            <span className="flex flex-col items-center leading-none text-white">
                <span className={cn("font-semibold tabular", isCurrent ? "text-[17px]" : "text-[14px]")}>{temperature === null ? "—" : `${roundTemp(temperature)}°`}</span>
                {weatherCode !== undefined && <WeatherGlyph code={weatherCode} isDay={isDay} size={isCurrent ? 15 : 12} strokeWidth={1.75} className="mt-0.5"/>}
            </span>
        </span>
        <span className="mt-0.5 size-2 rounded-full border-2 border-white/90 bg-[rgb(26_32_44)] shadow"/>
        <span className="mt-0.5 max-w-28 truncate text-[11px] font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]">{name}</span>
    </div>
);

/** A temperature reading on the temperature layer: a chip in the colour of its temperature. */
export const TemperatureChip = ({temperature}: {temperature: number}) => (
    <span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[12px] font-semibold text-[#0b0d11] shadow-[0_2px_8px_rgb(0_0_0/0.35)] tabular"
        style={{background: temperatureColor(temperature)}}
    >
        {roundTemp(temperature)}°
    </span>
);

/** A wind reading on the wind layer: an arrow the way the wind blows, in the colour of its Beaufort force. */
export const WindChip = ({speed, direction}: {speed: number; direction: number}) => (
    <span className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full bg-[rgb(20_24_32/0.82)] py-0.5 pr-2 pl-1 text-[11px] font-semibold text-white shadow tabular">
        <ArrowUp className="size-3.5" strokeWidth={2.5} style={{rotate: `${direction + 180}deg`, color: beaufortColor(beaufortForce(speed))}} aria-hidden/>
        {Math.round(speed)}
    </span>
);
