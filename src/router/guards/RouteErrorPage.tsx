import {CloudFog} from "lucide-react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";
import {buildRoute} from "@/constants/routes";
import {DEFAULT_CITY_ID} from "@/constants/cities";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/widgets/EmptyState";

/** Unknown URLs and invalid places land here, inside the normal shell and sky. */
export const RouteErrorPage = () => {
    const {t} = useTranslation();

    return (
        <div className="py-16">
            <EmptyState
                icon={<CloudFog/>}
                title={t("notFound.title")}
                description={t("notFound.description")}
                action={
                    <Button asChild variant="brand">
                        <Link to={buildRoute.city(DEFAULT_CITY_ID)}>{t("notFound.back")}</Link>
                    </Button>
                }
            />
        </div>
    );
};
