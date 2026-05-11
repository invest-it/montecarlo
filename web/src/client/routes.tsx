import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./pages/layout";
import { room } from "./pages/room";
import { rooms } from "./pages/rooms";
import { index } from "./pages";

export const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: index,
});

export const roomsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/rooms",
    component: rooms,
});

export const roomRoute = createRoute({
    getParentRoute: () => roomsRoute,
    path: ":id",
    component: room,
});

export const routeTree = rootRoute.addChildren([indexRoute, roomsRoute]);
