import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { createRoom, findRoomById, findRoomByOwner } from "./rooms";
import { getConnInfo } from "hono/bun";
import { error } from "@/result";
import { HTTPException } from "hono/http-exception";
import {
    CreateRoomRequest,
    CreateRoomResponse,
    IntrospectRoomRequest,
    IntrospectRoomResponse,
    PartialRoomResponse,
} from "@/schema/room-schemas";

const createRoomRoute = createRoute({
    method: "post",
    path: "/",
    request: {
        body: {
            content: {
                "application/json": { schema: CreateRoomRequest },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": { schema: CreateRoomResponse },
            },
            description: "Room created",
        },
    },
});

const queryRoomRoute = createRoute({
    method: "get",
    path: "/",
    parameters: [
        {
            in: "query",
            name: "owner",
            required: true,
            schema: { type: "string" },
        },
    ],
    responses: {
        200: {
            content: {
                "application/json": { schema: PartialRoomResponse },
            },
            description: "Room created",
        },
    },
});

const introspectRoomRoute = createRoute({
    method: "post",
    path: "/introspect",
    request: {
        body: {
            content: {
                "application/json": { schema: IntrospectRoomRequest },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": { schema: IntrospectRoomResponse },
            },
            description: "Room config",
        },
        401: { description: "Wrong password" },
        404: { description: "Room not found" },
    },
});

export const roomsAPI = new OpenAPIHono()
    .openapi(createRoomRoute, async (c) => {
        const { name, owner, password } = c.req.valid("json");
        const info = getConnInfo(c);

        const result = createRoom(name, owner, info.remote.address, password);
        if (result.ok) {
            return c.json(result.value);
        } else {
            console.error(result);
            throw new HTTPException(400, { cause: error(result) });
        }
    })
    .openapi(queryRoomRoute, async (c) => {
        const ownerId = c.req.param("owner");

        if (!ownerId) {
            throw new HTTPException(404, { cause: "owner param is required" });
        }

        const result = findRoomByOwner(ownerId);
        if (result) {
            return c.json({
                id: result.id,
                name: result.config.name,
                owner: result.config.owner,
            });
        } else {
            throw new HTTPException(404);
        }
    })
    .openapi(introspectRoomRoute, async (c) => {
        const { id, password } = c.req.valid("json");

        const result = findRoomById(id);
        if (!result) {
            throw new HTTPException(404);
        }
        if (result.config.password !== password) {
            throw new HTTPException(401);
        }

        return c.json({
            id: result.id,
            name: result.config.name,
            owner: result.config.owner,
            code: result.config.code,
        });
    });
