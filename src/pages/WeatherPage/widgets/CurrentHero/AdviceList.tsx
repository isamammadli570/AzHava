import type {LucideIcon} from "lucide-react";
import {CloudFog, CloudLightning, Leaf, Shirt, Smile, Snowflake, Sun, ThermometerSnowflake, ThermometerSun, Umbrella, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {ADVICE, type Advice, type AdviceId, type AdviceTone} from "@/helpers/advice";
import {cn, staggerIndex} from "@/lib/utils";

const ICONS: Record<AdviceId, LucideIcon> = {
    [ADVICE.UMBRELLA]: Umbrella,
    [ADVICE.SUNSCREEN]: Sun,
    [ADVICE.BUNDLE_UP]: ThermometerSnowflake,
    [ADVICE.JACKET]: Shirt,
    [ADVICE.HEAT]: ThermometerSun,
    [ADVICE.WIND]: Wind,
    [ADVICE.FOG]: CloudFog,
    [ADVICE.ICE]: Snowflake,
    [ADVICE.AIR]: Leaf,
    [ADVICE.STORM]: CloudLightning,
    [ADVICE.NICE_DAY]: Smile,
};

const TONE_CLASS: Record<AdviceTone, string> = {
    warning: "bg-warning-soft text-warning",
    info: "bg-accent-soft text-accent",
    good: "bg-success-soft text-success",
};

type AdviceListProps = {advice: Advice[]};

/** "What does this mean for me?" — the forecast turned into a few short tips. */
export const AdviceList = ({advice}: AdviceListProps) => {
    const {t} = useTranslation("weather");

    return (
        <div className="mt-6 border-t border-white/10 pt-5">
            <h2 className="section-label mb-3">{t("advice.title")}</h2>
            <ul className="stagger grid gap-2 sm:grid-cols-2">
                {advice.map((item, index) => {
                    const Icon = ICONS[item.id];
                    return (
                        <li key={item.id} style={staggerIndex(index + 2)} className="flex items-center gap-3 rounded-2xl bg-white/6 p-2.5 pr-3 text-sm">
                            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONE_CLASS[item.tone])}>
                                <Icon className="size-[18px] animate-[nudge_3s_ease-in-out_infinite]" style={{animationDelay: `${index * 0.4}s`}} aria-hidden/>
                            </span>
                            <span className="leading-snug">{t(`advice.${item.id}`)}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
