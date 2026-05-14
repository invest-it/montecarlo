import { useContext } from "react";
import { useStore, type StoreApi, type UseBoundStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

export function useContextStore<T, S>(
    context: React.Context<UseBoundStore<StoreApi<S>> | null>,
    selector: (state: S) => T,
): T {
    const store = useContext(context);
    if (!store)
        throw new Error("useFormStore must be used within FormProvider");
    return useStore(store, useShallow(selector));
}
