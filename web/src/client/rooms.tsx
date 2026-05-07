import { CreateRoomForm } from "./rooms/CreateRoomForm";
import { JoinRoomForm } from "./rooms/JoinRoomForm";

export function rooms() {
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
