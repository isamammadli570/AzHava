import type {LucideIcon} from "lucide-react";
import {CloudFog, CloudLightning, Leaf, Lightbulb, Shirt, Smile, Snowflake, Sun, ThermometerSnowflake, ThermometerSun, Umbrella, Wind} from "lucide-react";
import {useTranslation} from "react-i18next";
import {ADVICE, type Advice, type AdviceId, type AdviceTone} from "@/helpers/advice";
import {Card, CardHeader} from "@/components/ui/card";
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

type AdviceCardProps = {advice: Advice[]};

/** "What does this mean for me?" — the forecast turned into a few short tips, one per line. */
export const AdviceCard = ({advice}: AdviceCardProps) => {
    const {t} = useTranslation("weather");

    return (
        <Card aria-labelledby="advice-title" className="spotlight [grid-area:advice]">
            <CardHeader id="advice-title" icon={<Lightbulb/>} title={t("advice.title")} hasDivider/>
            <ul className="stagger">
                {advice.map((item, index) => {
                    const Icon = ICONS[item.id];
                    return (
                        <li key={item.id} style={staggerIndex(index)} className="flex items-center gap-3 border-b border-white/10 py-2.5 text-[15px] font-light last:border-b-0 last:pb-0">
                            <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", TONE_CLASS[item.tone])}>
                                {/* The wobble is on a <span>, not the <svg>: Chrome cannot run SVG animations on the GPU. */}
                                <span className="grid animate-[nudge_3s_ease-in-out_infinite] place-items-center" style={{animationDelay: `${index * 0.4}s`}}>
                                    <Icon className="size-4" strokeWidth={1.5} aria-hidden/>
                                </span>
                            </span>
                            <span className="leading-snug">{t(`advice.${item.id}`)}</span>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
};
