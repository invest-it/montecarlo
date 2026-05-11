import { useForm } from "@tanstack/react-form";
import { v4 as uuidv4 } from "uuid";
import { saveRoomUser, type RoomUser } from "../common/RoomUser";

interface Props {
    onCreated: (user: RoomUser) => void;
}

export function NicknameForm({ onCreated }: Props) {
    const form = useForm({
        defaultValues: { nickname: "" },
        onSubmit: ({ value }) => {
            const user: RoomUser = {
                id: uuidv4(),
                nickname: value.nickname.trim(),
            };
            saveRoomUser(user);
            onCreated(user);
        },
    });

    return (
        <div className="card bg-base-300 rounded-box p-8 max-w-sm w-full mx-auto">
            <h2 className="text-xl mb-4">Wähle einen Nutzernamen</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.Field
                    name="nickname"
                    validators={{
                        onChange: ({ value }) =>
                            value.trim().length === 0
                                ? "Pflichtfeld"
                                : undefined,
                    }}
                    children={(field) => (
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                Nickname
                            </legend>
                            <input
                                type="text"
                                className="input w-full"
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                placeholder="z.B. MaxMustermann"
                                maxLength={32}
                                autoFocus
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="label text-error">
                                    {String(field.state.meta.errors[0])}
                                </p>
                            )}
                        </fieldset>
                    )}
                />
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <button
                            className="btn btn-primary btn-sm mt-4"
                            type="submit"
                            disabled={!canSubmit}
                        >
                            {isSubmitting ? "..." : "Weiter"}
                        </button>
                    )}
                />
            </form>
        </div>
    );
}
