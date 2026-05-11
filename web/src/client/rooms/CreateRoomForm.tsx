import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff } from "lucide-react";
import { hc } from "hono/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiClient } from "@/index";
import type { CreateRoomRequest } from "@/schema/room-schemas";
import { useRoomUser } from "../common/RoomUser";

const CHARSET =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";

function generatePassword(): string {
    return Array.from(
        { length: 10 },
        () => CHARSET[Math.floor(Math.random() * CHARSET.length)],
    ).join("");
}

export function CreateRoomForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showReenter, setShowReenter] = useState(false);

    const roomUser = useRoomUser();

    const initialPassword = generatePassword();

    const queryClient = useQueryClient();
    const createRoomQuery = useMutation({
        mutationFn: async (value: CreateRoomRequest) => {
            const client = hc<ApiClient>("http://localhost:3000");
            return await client.api.room.$post({
                json: {
                    name: value.name,
                    password: value.password,
                    owner: value.owner,
                },
            });
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["owned-room"], data);
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
            password: initialPassword,
            reenter_password: initialPassword,
        },
        onSubmit: async ({ value }) => {
            console.log(value);
            const res = await createRoomQuery.mutateAsync({
                name: value.name,
                password: value.password,
                owner: roomUser?.nickname!!,
            });
            const data = await res.json();
            console.log(data);
        },
    });

    return (
        <div>
            <h2 className="text-xl">Neuen Raum erstellen</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div>
                    <form.Field
                        name="password"
                        children={(field) => {
                            return (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend">
                                            Passwort
                                        </legend>
                                        <label className="input">
                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
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
                                </>
                            );
                        }}
                    />
                    <form.Field
                        name="reenter_password"
                        children={(field) => {
                            return (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend">
                                            Passwort bestätigen
                                        </legend>
                                        <label className="input">
                                            <input
                                                type={
                                                    showReenter
                                                        ? "text"
                                                        : "password"
                                                }
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs"
                                                onClick={() =>
                                                    setShowReenter((v) => !v)
                                                }
                                                tabIndex={-1}
                                            >
                                                {showReenter ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                        </label>
                                    </fieldset>
                                </>
                            );
                        }}
                    />
                    <form.Field
                        name="name"
                        children={(field) => {
                            return (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend">
                                            Raum-Name?
                                        </legend>
                                        <input
                                            type="text"
                                            className="input"
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Type here"
                                        />
                                        <p className="label">Optional</p>
                                    </fieldset>
                                </>
                            );
                        }}
                    />
                    <form.Subscribe
                        selector={(state) => [
                            state.canSubmit,
                            state.isSubmitting,
                        ]}
                        children={([canSubmit, isSubmitting]) => (
                            <>
                                <button
                                    className="btn btn-sm btn-primary"
                                    type="submit"
                                    disabled={!canSubmit}
                                >
                                    {isSubmitting ? "..." : "Create"}
                                </button>
                            </>
                        )}
                    />
                </div>
            </form>
        </div>
    );
}
