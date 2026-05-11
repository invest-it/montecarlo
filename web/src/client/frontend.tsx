/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import {
    createRoute,
    createRouter,
    RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { rootRoute } from "./layout";
import { rooms } from "./rooms";
import { index } from "./index";

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: index,
});

const roomsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/rooms",
    component: rooms,
});

const routeTree = rootRoute.addChildren([indexRoute, roomsRoute]);

const router = createRouter({ routeTree });

const elem = document.getElementById("root")!;
const app = (
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);

createRoot(elem).render(app);
