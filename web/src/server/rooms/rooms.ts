import { Err, Ok, type Result } from "@/result";
import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import type { SocketAddress } from "bun";

interface RoomConfig {
    name: string;
    owner: string;
}

const rooms: { [id: string]: RoomConfig } = {};
const roomsByOwners: { [owner: string]: string } = {};
const roomsByIP: { [owner: string]: string } = {};

type CreateRoomError = "UNRESOLVED" | "EXISTING";

export function createRoom(
    name: string,
    owner: string,
    ownerIP: string | undefined,
): Result<string, CreateRoomError> {
    const id = crypto.randomUUID();

    if (!ownerIP) {
        console.warn(`Could not solve IP for ${owner}`);
        if (process.env.NODE_ENV === "development") {
            // Sockets on localhost may not have an IP
            ownerIP = "UNRESOLVED";
        } else {
            return Err("UNRESOLVED");
        }
    }

    const existing = roomsByIP[ownerIP];
    if (existing) {
        return Err("EXISTING");
    }

    rooms[id] = {
        name,
        owner,
    };
    roomsByOwners[owner] = id;
    roomsByIP[ownerIP] = id;

    return Ok(id);
}
