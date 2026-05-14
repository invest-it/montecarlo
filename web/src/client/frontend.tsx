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

import "./i18n";
import { routeTree } from "./routes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query/client";

const router = createRouter({ routeTree });

const elem = document.getElementById("root")!;
const app = (
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>
);

createRoot(elem).render(app);
