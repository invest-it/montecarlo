import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";

interface RoomConfig {
    name: string;
    owner: string;
}

const rooms: { [id: string]: RoomConfig } = {};
const roomsByOwners: { [owner: string]: string } = {};

const CreateRoomRequest = z
    .object({
        name: z.string().openapi({ example: "Room 1" }),
        owner: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
        // TODO: Use something more secure?
    })
    .openapi("CreateRoomRequest");

const CreateRoomResponse = z
    .object({ id: z.string(), name: z.string() })
    .openapi("CreateRoomResponse");

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

            // TODO: Limit to one per owner (ip?)

            const id = crypto.randomUUID();
            rooms[id] = {
                name,
                owner,
            };

            return c.json({ id: id, name });
        },
    );
}

export default roomHandlers;
