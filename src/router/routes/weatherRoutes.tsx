import type {RouteObject} from "react-router";
import {ROUTES} from "@/constants/routes";
import {pageRoute} from "@/router/preload";
import {redirectToLastPlace} from "@/router/guards";
import {Loading} from "@/widgets/Loading";

const weatherPage = () => import("@/pages/WeatherPage");

export const weatherRoutes: RouteObject[] = [
    {index: true, loader: redirectToLastPlace, Component: Loading},
    pageRoute(ROUTES.CITY, weatherPage, "WeatherPage"),
    pageRoute(ROUTES.PLACE, weatherPage, "WeatherPage"),
    pageRoute(ROUTES.CITIES, () => import("@/pages/CitiesPage"), "CitiesPage"),
];
