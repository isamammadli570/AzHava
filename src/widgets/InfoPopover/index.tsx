import {Info} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

type InfoPopoverProps = {title: string; text: string};

/** Small "what is this?" button that explains a metric in plain words; works with tap as well as click. */
export const InfoPopover = ({title, text}: InfoPopoverProps) => {
    const {t} = useTranslation();

    return (
        <Popover>
            <PopoverTrigger
                aria-label={`${t("about")} ${title}`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-subtle-foreground transition-colors duration-(--duration-fast) hover:bg-glass-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:bg-white/12 data-[state=open]:text-foreground"
            >
                <Info className="size-3.5"/>
            </PopoverTrigger>
            <PopoverContent align="end">
                <p className="mb-1 font-semibold">{title}</p>
                <p className="text-muted-foreground">{text}</p>
            </PopoverContent>
        </Popover>
    );
};
