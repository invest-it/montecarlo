import { serve } from "bun";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import socket from "./server/socket";
import roomHandlers from "./server/rooms/room-handlers";

const app = new OpenAPIHono();

// --- Schemas ---

const HelloResponse = z
    .object({ message: z.string(), method: z.string() })
    .openapi("HelloResponse");

const HelloNameParams = z
    .object({ name: z.string().openapi({ example: "world" }) })
    .openapi("HelloNameParams");

const HelloNameResponse = z
    .object({ message: z.string() })
    .openapi("HelloNameResponse");

// --- Routes ---

app.openapi(
    createRoute({
        method: "get",
        path: "/api/hello",
        responses: {
            200: {
                content: { "application/json": { schema: HelloResponse } },
                description: "Returns a hello message",
            },
        },
    }),
    (c) => c.json({ message: "Hello, world!", method: "GET" }),
);

app.openapi(
    createRoute({
        method: "put",
        path: "/api/hello",
        responses: {
            200: {
                content: { "application/json": { schema: HelloResponse } },
                description: "Returns a hello message",
            },
        },
    }),
    (c) => c.json({ message: "Hello, world!", method: "PUT" }),
);

app.openapi(
    createRoute({
        method: "get",
        path: "/api/hello/{name}",
        request: { params: HelloNameParams },
        responses: {
            200: {
                content: { "application/json": { schema: HelloNameResponse } },
                description: "Returns a personalized hello message",
            },
        },
    }),
    (c) => {
        const { name } = c.req.valid("param");
        return c.json({ message: `Hello, ${name}!` });
    },
);

roomHandlers(app);

// --- OpenAPI spec + Swagger UI ---

app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: { title: "InvestIt MonteCarlo API", version: "1.0.0" },
});

app.get("/ui", swaggerUI({ url: "/openapi.json" }));

// --- Server ---
const nonce = crypto.randomUUID();

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
