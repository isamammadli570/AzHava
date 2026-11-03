import type {LucideIcon} from "lucide-react";
import {Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun} from "lucide-react";
import {CONDITION, conditionFromCode, type Condition} from "@/helpers/weather";
import {cn} from "@/lib/utils";

const DAY: Record<Condition, LucideIcon> = {
    [CONDITION.CLEAR]: Sun,
    [CONDITION.PARTLY_CLOUDY]: CloudSun,
    [CONDITION.CLOUDY]: Cloud,
    [CONDITION.FOG]: CloudFog,
    [CONDITION.DRIZZLE]: CloudDrizzle,
    [CONDITION.RAIN]: CloudRain,
    [CONDITION.SNOW]: CloudSnow,
    [CONDITION.THUNDER]: CloudLightning,
};

const NIGHT: Partial<Record<Condition, LucideIcon>> = {
    [CONDITION.CLEAR]: Moon,
    [CONDITION.PARTLY_CLOUDY]: CloudMoon,
};

type WeatherGlyphProps = {code: number; isDay?: boolean; size?: number; strokeWidth?: number; label?: string; className?: string};

/** Thin outline weather symbol for lists (hours, days, cities): calm, monochrome, the same weight as the text. */
export const WeatherGlyph = ({code, isDay = true, size = 22, strokeWidth = 1.25, label, className}: WeatherGlyphProps) => {
    const condition = conditionFromCode(code);
    const Icon = (!isDay && NIGHT[condition]) || DAY[condition];
    return (
        <Icon
            size={size}
            strokeWidth={strokeWidth}
            role={label ? "img" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn("shrink-0", className)}
        />
    );
};
