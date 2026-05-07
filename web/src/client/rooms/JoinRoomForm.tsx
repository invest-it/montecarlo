import { useForm } from "@tanstack/react-form";

export function JoinRoomForm() {
    const form = useForm({
        defaultValues: {
            id: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            console.log(value);
        },
    });

    return (
        <div>
            <h2 className="text-xl">Raum beitreten</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div>
                    <form.Field
                        name="id"
                        children={(field) => {
                            return (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend">
                                            Raum-ID
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
                                    {isSubmitting ? "..." : "Join"}
                                </button>
                            </>
                        )}
                    />
                </div>
            </form>
        </div>
    );
}
