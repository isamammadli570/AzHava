import {useCallback} from "react";
import {useLocation, useNavigate, useSearchParams} from "react-router";

export const SHEETS = ["conditions", "wind", "moon", "sun", "uv", "humidity", "visibility", "pressure", "radar"] as const;
export type SheetKind = (typeof SHEETS)[number];

/** The conditions sheet can open on the real temperature or on the feels-like one. */
export const TEMPERATURE_MODES = ["actual", "feels"] as const;
export type TemperatureMode = (typeof TEMPERATURE_MODES)[number];

const PARAM = {SHEET: "detail", DAY: "day", MODE: "mode"} as const;

const isSheet = (value: string | null): value is SheetKind => SHEETS.some((sheet) => sheet === value);

const withoutSheet = (params: URLSearchParams): URLSearchParams => {
    Object.values(PARAM).forEach((key) => params.delete(key));
    return params;
};

type SheetState = {fromPage?: boolean};

type OpenOptions = {day?: number; mode?: TemperatureMode};

/**
 * Opens a detail sheet by putting it in the address (`?detail=wind&day=2`): the sheet can be shared or reloaded, and
 * the phone's back button closes it. Opening pushes a history entry; closing goes back over it when it was ours.
 */
export const useOpenSheet = () => {
    const navigate = useNavigate();
    return useCallback(
        (sheet: SheetKind, {day = 0, mode}: OpenOptions = {}) => {
            // Read at call time (keeps a searched place's name and country) instead of subscribing every card to the URL.
            const params = withoutSheet(new URLSearchParams(window.location.search));
            params.set(PARAM.SHEET, sheet);
            if (day > 0) params.set(PARAM.DAY, String(day));
            if (mode) params.set(PARAM.MODE, mode);
            navigate({search: `?${params}`}, {state: {fromPage: true} satisfies SheetState, preventScrollReset: true});
        },
        [navigate],
    );
};

/** The open sheet (if any) and the day and mode it shows, read from the address, plus ways to change or close it. */
export const useDetailSheet = () => {
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const raw = params.get(PARAM.SHEET);
    const sheet = isSheet(raw) ? raw : null;
    const day = Math.max(0, Math.floor(Number(params.get(PARAM.DAY)) || 0));
    const mode: TemperatureMode = params.get(PARAM.MODE) === "feels" ? "feels" : "actual";
    const fromPage = (location.state as SheetState | null)?.fromPage === true;

    const update = useCallback(
        (key: string, value: string | null) =>
            setParams(
                (previous) => {
                    const next = new URLSearchParams(previous);
                    if (value === null) next.delete(key);
                    else next.set(key, value);
                    return next;
                },
                {replace: true, state: location.state, preventScrollReset: true},
            ),
        [setParams, location.state],
    );

    const setDay = useCallback((value: number) => update(PARAM.DAY, value > 0 ? String(value) : null), [update]);
    const setMode = useCallback((value: TemperatureMode) => update(PARAM.MODE, value === "feels" ? value : null), [update]);
    const close = useCallback(() => {
        if (fromPage) {
            navigate(-1);
            return;
        }
        setParams((previous) => withoutSheet(new URLSearchParams(previous)), {replace: true, preventScrollReset: true});
    }, [fromPage, navigate, setParams]);

    return {sheet, day, mode, setDay, setMode, close};
};
