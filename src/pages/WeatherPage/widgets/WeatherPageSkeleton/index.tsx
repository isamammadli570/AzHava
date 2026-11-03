import {useTranslation} from "react-i18next";
import {Skeleton} from "@/components/ui/skeleton";

/** Placeholder shaped like the real page (centred headline, then cards), so nothing jumps when the forecast arrives. */
export const WeatherPageSkeleton = () => {
    const {t} = useTranslation();

    return (
        <div role="status" className="grid animate-fade-in gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-5">
            <span className="sr-only">{t("loading")}</span>
            <div className="flex flex-col items-center gap-3 py-6 lg:col-span-2">
                <Skeleton className="h-4 w-56"/>
                <Skeleton className="h-9 w-44"/>
                <Skeleton className="h-24 w-36"/>
                <Skeleton className="h-6 w-40"/>
            </div>
            <div className="glass space-y-3 rounded-[1.375rem] p-4 sm:p-5">
                <Skeleton className="h-5 w-3/4"/>
                <Skeleton className="h-52 w-full"/>
            </div>
            <div className="glass space-y-3 rounded-[1.375rem] p-4 sm:p-5">
                {Array.from({length: 7}, (_, index) => <Skeleton key={index} className="h-10 w-full"/>)}
            </div>
        </div>
    );
};
