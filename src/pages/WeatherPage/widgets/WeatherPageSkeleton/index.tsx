import {useTranslation} from "react-i18next";
import {Skeleton} from "@/components/ui/skeleton";

/** Placeholder shaped like the real page, so nothing jumps when the first forecast arrives. */
export const WeatherPageSkeleton = () => {
    const {t} = useTranslation();

    return (
        <div role="status" className="grid animate-fade-in gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <span className="sr-only">{t("loading")}</span>
            <div className="min-w-0 space-y-4 sm:space-y-5">
                <div className="glass space-y-6 rounded-[2rem] p-5 sm:p-8">
                    <Skeleton className="h-9 w-48"/>
                    <Skeleton className="h-4 w-64"/>
                    <div className="flex items-center gap-8">
                        <Skeleton className="size-32 rounded-full"/>
                        <Skeleton className="h-28 w-40"/>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-24 rounded-full"/>
                        <Skeleton className="h-8 w-24 rounded-full"/>
                        <Skeleton className="h-8 w-32 rounded-full"/>
                    </div>
                </div>
                <div className="glass rounded-3xl p-5">
                    <Skeleton className="h-56 w-full"/>
                </div>
            </div>
            <div className="glass space-y-3 rounded-3xl p-5">
                {Array.from({length: 7}, (_, index) => <Skeleton key={index} className="h-11 w-full"/>)}
            </div>
        </div>
    );
};
