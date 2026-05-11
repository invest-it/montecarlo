import { useState } from "react";
import { CreateRoomForm } from "../rooms/CreateRoomForm";
import { JoinRoomForm } from "../rooms/JoinRoomForm";
import { NicknameForm } from "../rooms/NicknameForm";
import { loadRoomUser, type RoomUser } from "../common/RoomUser";
import { useQueryOwnedRoom } from "../common/Room";

export function rooms() {
    const [roomUser, setRoomUser] = useState<RoomUser | null>(loadRoomUser);
    const { room, isLoading } = useQueryOwnedRoom();

    if (!roomUser) {
        return <NicknameForm onCreated={setRoomUser} />;
    }

    return (
        <div>
            <div className="flex w-full flex-col lg:flex-row">
                <div className="card bg-base-300 rounded-box grid py-5 grow place-items-center">
                    <JoinRoomForm />
                </div>
                <div className="divider lg:divider-horizontal">OR</div>
                <div className="card bg-base-300 rounded-box grid py-5 grow place-items-center">
                    <CreateRoomForm />
                </div>
            </div>
        </div>
    );
}
