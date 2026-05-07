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

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: function Index() {
        return (
            <div className="p-2">
                <h3>Welcome Home!</h3>
            </div>
        );
    },
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

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
