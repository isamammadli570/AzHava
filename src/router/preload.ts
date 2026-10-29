import type {ComponentType} from "react";
import type {LazyRouteFunction, RouteObject} from "react-router";

type PageModule = Record<string, ComponentType>;

const preloaders = new Map<string, () => Promise<unknown>>();

/**
 * A route whose page is code-split. The same importer is remembered, so hovering a link can warm the chunk
 * before the click (see `preloadRoute`).
 */
export const pageRoute = <TModule extends PageModule>(
    path: string,
    importer: () => Promise<TModule>,
    exportName: keyof TModule & string,
    extra: Omit<RouteObject, "path" | "lazy" | "Component" | "children" | "index"> = {},
): RouteObject => {
    preloaders.set(path, importer);
    const lazy: LazyRouteFunction<RouteObject> = async () => ({Component: (await importer())[exportName]});
    return {path, lazy, ...extra} as RouteObject;
};

export const preloadRoute = (path: string): void => {
    void preloaders.get(path)?.();
};
