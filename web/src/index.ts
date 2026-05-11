import { serve } from "bun";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import socket from "./server/socket";
import { roomsAPI } from "./server/rooms/rooms-api";
import { cors } from "hono/cors";

// --- Schemas ---

// --- Routes ---
const _app = new OpenAPIHono();

_app.use(
    "/api/*",
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
    }),
);

const app = new OpenAPIHono(_app).route("/api/room", roomsAPI);

// --- OpenAPI spec + Swagger UI ---

app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "InvestIt MonteCarlo API", version: "1.0.0" },
});

app.get("/ui", swaggerUI({ url: "/openapi.json" }));

export type ApiClient = typeof app;

// --- Server ---

const server = serve({
    websocket: socket.ws,
    routes: {
        "/socket.io/*": (req: Request, server) => socket.handler(req, server),
        "/api/*": app.fetch,
        "/openapi.json": app.fetch,
        "/ui": app.fetch,
        "/*": (req) => {
            const path = new URL(req.url).pathname;
            return new Response(
                Bun.file(`./dist${path === "/" ? "/index.html" : path}`),
            );
        },
        /*       [`/${nonce}`]: index,
        "/": async (request) => {
            const response: Response = await fetch(`${server.url}/${nonce}`);
            const headers = new Headers(response.headers);
            headers.set("Cross-Origin-Opener-Policy", "same-origin");
            headers.set("Cross-Origin-Embedder-Policy", "require-corp");
            return new Response(response.body, {
                status: response.status,
                headers,
            });
        },
*/
    },
    development: process.env.NODE_ENV !== "production" && {
        console: true,
    },
});

console.log(`🚀 Server running at ${server.url}`);
