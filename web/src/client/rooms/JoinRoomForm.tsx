import { useForm } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

export function JoinRoomForm() {
    const { t } = useTranslation();
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
            <h2 className="text-xl">{t("rooms.join.title")}</h2>
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
                                            {t("rooms.join.roomId")}
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
                                            placeholder={t("rooms.join.placeholder")}
                                        />
                                        <p className="label">{t("rooms.join.optional")}</p>
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
                                    {isSubmitting ? "..." : t("rooms.join.submit")}
                                </button>
                            </>
                        )}
                    />
                </div>
            </form>
        </div>
    );
}
