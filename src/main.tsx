import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {RouterProvider} from "react-router";
import "@/index.css";
import i18n from "@/i18n";
import QueryProvider from "@/provider/QueryProvider";
import {ErrorBoundary} from "@/widgets/ErrorBoundary";
import {Toaster} from "@/components/ui/sonner";
import {router} from "@/router";
import {initPwa} from "@/services/pwa";
import {initAdaptiveQuality} from "@/services/quality";

const syncDocumentLanguage = (language: string): void => {
    document.documentElement.lang = language.split("-")[0];
};

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);
initPwa();
initAdaptiveQuality();

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <ErrorBoundary>
            <QueryProvider>
                <RouterProvider router={router}/>
                <Toaster/>
            </QueryProvider>
        </ErrorBoundary>
    </StrictMode>,
);
