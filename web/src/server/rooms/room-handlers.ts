import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createRoom } from "./rooms";
import { getConnInfo } from "hono/bun";
import { error, value } from "@/result";
import { HTTPException } from "hono/http-exception";
import { CreateRoomRequest, CreateRoomResponse } from "@/schema/room";

function roomHandlers(app: OpenAPIHono) {
    app.openapi(
        createRoute({
            method: "post",
            path: "/api/room",
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
        }),
        async (c) => {
            const { name, owner } = c.req.valid("json");
            const info = getConnInfo(c);

            const result = createRoom(name, owner, info.remote.address);
            if (result.ok) {
                const id = value(result);
                return c.json({ id: id, name });
            } else {
                throw new HTTPException(400, { cause: error(result) });
            }
        },
    );
}

export default roomHandlers;
