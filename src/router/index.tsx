import {createBrowserRouter, type RouteObject} from "react-router";
import {MainLayout} from "@/layout/MainLayout";
import {Loading} from "@/widgets/Loading";
import {RouteErrorPage} from "@/router/guards/RouteErrorPage";
import {weatherRoutes} from "@/router/routes/weatherRoutes";
import {ROUTES} from "@/constants/routes";

const routes: RouteObject[] = [
    {
        id: "app",
        path: ROUTES.ROOT,
        Component: MainLayout,
        HydrateFallback: Loading,
        children: [
            // Errors render inside the layout so the header and sky stay in place.
            {errorElement: <RouteErrorPage/>, children: [...weatherRoutes, {path: "*", Component: RouteErrorPage}]},
        ],
    },
];

export const router = createBrowserRouter(routes);
