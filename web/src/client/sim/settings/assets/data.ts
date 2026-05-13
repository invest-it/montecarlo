import { useContextStore } from "@/client/common/hooks";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export interface AssetInfo {
    index: number;
    label: string;
    mu: number;
    sigma: number;
}

interface AssetStore {
    assets: AssetInfo[];
    setAssets: (assets: AssetInfo[]) => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
    assets: [],
    setAssets: (assets: AssetInfo[]) => set({ assets }),
}));

export const useAssets = () =>
    useAssetStore(useShallow((state) => state.assets));
