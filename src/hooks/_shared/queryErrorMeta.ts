import {toast} from "sonner";
import i18n from "@/i18n";

/** Request errors are toasted once, by the global cache handler, through this `meta.onError`. */
export const loadErrorMeta = (messageKey: string) => ({
    onError: () => {
        toast.error(i18n.t(messageKey as never));
    },
});
