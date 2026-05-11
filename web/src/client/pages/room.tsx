import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { hc } from "hono/client";
import { useMutation } from "@tanstack/react-query";
import { roomRoute } from "../routes";
import { useQueryOwnedRoom } from "../common/Room";
import type { ApiClient } from "@/index";
import type { IntrospectRoomResponse } from "@/schema/room-schemas";

export function room() {
    const { id } = roomRoute.useParams();
    const { room, isLoading } = useQueryOwnedRoom();

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [roomConfig, setRoomConfig] = useState<IntrospectRoomResponse | null>(
        null,
    );

    const introspect = useMutation({
        mutationFn: async () => {
            const client = hc<ApiClient>("http://localhost:3000");
            const res = await client.api.room.introspect.$post({
                json: { id, password },
            });
            if (!res.ok) {
                throw new Error(res.status === 401 ? "Falsches Passwort" : "Raum nicht gefunden");
            }
            return res.json() as Promise<IntrospectRoomResponse>;
        },
        onSuccess: (data) => setRoomConfig(data),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <span className="loading loading-spinner" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col lg:flex-row">
            <div className="p-6 w-full max-w-md">
                {room && !roomConfig && (
                    <div className="card bg-base-300 rounded-box p-6">
                        <h2 className="text-xl mb-4">Raum {room.name ?? id}</h2>
                        <p className="text-sm text-base-content/60 mb-4">
                            Passwort eingeben um den Raum-Code zu sehen
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                introspect.mutate();
                            }}
                        >
                            <fieldset className="fieldset mb-4">
                                <legend className="fieldset-legend">
                                    Passwort
                                </legend>
                                <label className="input">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </label>
                            </fieldset>
                            {introspect.error && (
                                <p className="text-error text-sm mb-3">
                                    {introspect.error.message}
                                </p>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={
                                    !password || introspect.isPending
                                }
                            >
                                {introspect.isPending ? "..." : "Bestätigen"}
                            </button>
                        </form>
                    </div>
                )}

                {roomConfig && (
                    <div className="card bg-base-300 rounded-box p-6">
                        <h2 className="text-xl mb-4">{roomConfig.name}</h2>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-base-content/60">
                                    Raum-Code
                                </span>
                                <p className="font-mono font-bold text-lg tracking-wider">
                                    {roomConfig.code}
                                </p>
                            </div>
                            <div>
                                <span className="text-base-content/60">
                                    Eigentümer
                                </span>
                                <p>{roomConfig.owner}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!room && (
                    <div>
                        <p>Raum {id}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
