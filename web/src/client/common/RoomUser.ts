import { z } from "zod";

export const RoomUserSchema = z.object({
    id: z.uuid(),
    nickname: z.string().min(1).max(32),
});

export type RoomUser = z.infer<typeof RoomUserSchema>;

const STORAGE_KEY = "roomUser";

export function loadRoomUser(): RoomUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return RoomUserSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function saveRoomUser(user: RoomUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function useRoomUser() {
    const user = loadRoomUser();
    return user;
}
