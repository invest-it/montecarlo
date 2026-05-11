import z from "zod";

export const CreateRoomRequest = z
    .object({
        name: z.string().openapi({ example: "Room 1" }),
        owner: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
        password: z
            .string()
            .openapi({ example: "This-Is-A-Unsecure-Password" }),
    })
    .openapi("CreateRoomRequest");

export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

export const CreateRoomResponse = z
    .object({
        name: z.string().openapi({ example: "Room 1" }),
        owner: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
        code: z.string().openapi({ example: "a1b2c3d4e5" }),
    })
    .openapi("CreateRoomResponse");

export type CreateRoomResponse = z.infer<typeof CreateRoomResponse>;

export const PartialRoomResponse = z
    .object({
        id: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
        name: z.string().openapi({ example: "Room 1" }).optional(),
        owner: z
            .string()
            .openapi({ example: "9a841672-cb84-4758-a48c-7c522e4a0483" }),
    })
    .openapi("PartialRoomResponse");

export type PartialRoomResponse = z.infer<typeof PartialRoomResponse>;

export const IntrospectRoomRequest = z.object({
    id: z.string(),
    password: z.string(),
});
export type IntrospectRoomRequest = z.infer<typeof IntrospectRoomRequest>;

export const IntrospectRoomResponse = z.object({
    id: z.string(),
    name: z.string(),
    owner: z.string(),
    code: z.string(),
});
export type IntrospectRoomResponse = z.infer<typeof IntrospectRoomResponse>;
