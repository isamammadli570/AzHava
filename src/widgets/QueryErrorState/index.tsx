import {CloudOff, RotateCw} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";

type QueryErrorStateProps = {
    message?: string | null;
    onRetry?: () => void;
};

export const QueryErrorState = ({message, onRetry}: QueryErrorStateProps) => {
    const {t} = useTranslation();

    return (
        <div role="alert" className="glass mx-auto flex max-w-md animate-fade-up flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
            <CloudOff className="size-10 text-muted-foreground" aria-hidden/>
            <p className="text-sm text-muted-foreground">{message || t("errors.load")}</p>
            {onRetry && (
                <Button variant="brand" onClick={onRetry}>
                    <RotateCw/>
                    {t("retry")}
                </Button>
            )}
        </div>
    );
};
