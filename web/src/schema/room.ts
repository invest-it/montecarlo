import z from "zod";

export const CreateRoomRequest = z
    .object({
        name: z.string().openapi({ example: "Room 1" }),
        owner: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
        // TODO: Use something more secure?
    })
    .openapi("CreateRoomRequest");

export const CreateRoomResponse = z
    .object({ id: z.string(), name: z.string() })
    .openapi("CreateRoomResponse");
