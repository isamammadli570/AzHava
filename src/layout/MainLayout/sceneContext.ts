import {useEffect} from "react";
import {useOutletContext} from "react-router";
import type {Scene} from "@/helpers/weather";

export type LayoutContext = {setScene: (scene: Scene) => void};

/** Lets a page paint the shared sky behind the layout; pass a memoised scene (or null while loading). */
export const useLayoutScene = (scene: Scene | null) => {
    const {setScene} = useOutletContext<LayoutContext>();

    useEffect(() => {
        if (scene) setScene(scene);
    }, [scene, setScene]);
};
