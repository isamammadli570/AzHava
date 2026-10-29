import {useState, type ReactNode} from "react";
import {MutationCache, QueryCache, QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {toast} from "sonner";
import {ApiError} from "@/api/client";
import i18n from "@/i18n";
import {ERRORS} from "@/constants/errors";

type CacheMeta = {suppressGlobalError?: boolean; onError?: (error: unknown) => void} | undefined;

const NETWORK_TOAST_ID = "network-error";

const handleError = (error: unknown, meta: CacheMeta): void => {
    if (meta?.suppressGlobalError) return;
    if (error instanceof ApiError && error.isNetworkError) {
        // Several queries fail together when offline; one toast is enough.
        toast.error(error.message, {id: NETWORK_TOAST_ID});
        return;
    }
    if (typeof meta?.onError === "function") {
        meta.onError(error);
        return;
    }
    toast.error(error instanceof Error ? error.message : i18n.t(ERRORS.LOAD));
};

const createQueryClient = (): QueryClient =>
    new QueryClient({
        queryCache: new QueryCache({onError: (error, query) => handleError(error, query.meta as CacheMeta)}),
        mutationCache: new MutationCache({onError: (error, _variables, _context, mutation) => handleError(error, mutation.meta as CacheMeta)}),
        defaultOptions: {
            queries: {
                // Fire the request even when the browser says offline: the service worker answers with the last
                // saved forecast, so an installed app still opens with data instead of an endless skeleton.
                networkMode: "offlineFirst",
                refetchOnWindowFocus: false,
                staleTime: 30_000,
                gcTime: 15 * 60_000,
                retry: (count, error) => {
                    const status = (error as {status?: number | null}).status;
                    if (status === 400 || status === 404) return false;
                    return count < 2;
                },
            },
        },
    });

export default function QueryProvider({children}: {children: ReactNode}) {
    const [queryClient] = useState(createQueryClient);
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
