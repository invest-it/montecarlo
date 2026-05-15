import { Err, Ok, type Result } from "@/shared/result";

export interface RoomConfig {
    name: string;
    owner: string;
    password: string; // Password for the room admin
    code: string;
}

const rooms: { [id: string]: RoomConfig } = {};
const roomsByOwners: { [owner: string]: string } = {};
const roomsByIP: { [owner: string]: string } = {};

type CreateRoomError = "UNRESOLVED" | "EXISTING";

export function findRoomById(
    id: string,
): { id: string; config: RoomConfig } | undefined {
    const config = rooms[id];
    return config ? { id, config } : undefined;
}

export function findRoomByOwner(
    owner: string,
): { id: string; config: RoomConfig } | undefined {
    const id = roomsByOwners[owner];
    return id ? { id, config: rooms[id]! } : undefined;
}

export function createRoom(
    name: string,
    owner: string,
    ownerIP: string | undefined,
    password: string,
): Result<RoomConfig, CreateRoomError> {
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

    const array = new Uint32Array(10);
    crypto.getRandomValues(array);

    const code = Array.from(array, (n) => n.toString(36)).join("");

    rooms[id] = {
        name,
        owner,
        password,
        code,
    };
    roomsByOwners[owner] = id;
    roomsByIP[ownerIP] = id;

    return Ok(rooms[id]);
}
// TODO: TTL 10 minutes after last user connection
