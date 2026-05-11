import { useQuery } from "@tanstack/react-query";
import { useRoomUser } from "./RoomUser";
import type { PartialRoomResponse } from "@/schema/room-schemas";
import type { ApiClient } from "@/index";
import { hc } from "hono/client";

export const useOwnedRoom = () => {
    const user = useRoomUser();
    const query = useQuery({
        queryKey: ["ownedRoom"],
        queryFn: async () => {
            const response = await fetch(`/api/rooms?owner=${user?.id}`);
            const data = await response.json();
            return data;
        },
    });
};

export const useQueryOwnedRoom = (): {
    room?: PartialRoomResponse;
    isLoading: boolean;
} => {
    const user = useRoomUser();
    const result = useQuery({
        queryKey: ["ownedRoomId"],
        queryFn: async () => {
            const client = hc<ApiClient>("http://localhost:3000");
            const response = await client.api.room.$get({ owner: user?.id });
            const data = await response.json();
            return data;
        },
        retry: false,
    });

    if (result.isLoading) return { isLoading: true };
    if (result.error) return { isLoading: false };
    return { room: result.data, isLoading: false };
};
