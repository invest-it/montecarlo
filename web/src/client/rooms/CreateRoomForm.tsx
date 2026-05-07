import { useForm } from "@tanstack/react-form";
import { password } from "bun";

export function CreateRoomForm() {
    const form = useForm({
        defaultValues: {
            name: "",
            password: "",
            reenter_password: "",
        },
        onSubmit: async ({ value }) => {
            console.log(value);
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
                    <form.Field
                        name="password"
                        children={(field) => {
                            return (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend">
                                            Passwort
                                        </legend>
                                        <input
                                            type="password"
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
                                        />
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
                                        <input
                                            type="password"
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
                                        />
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
