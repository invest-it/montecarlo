import { useWasm } from "@/client/init-wasm";
import { get_available_assets } from "@/wasm/core";
import { useEffect } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export interface AssetInfo {
    index: number;
    label: string;
    mu: number;
    sigma: number;
}

export interface AssetInfoMap {
    [label: string]: AssetInfo;
}

interface AssetStore {
    assets: AssetInfoMap;
    setAssets: (assets: AssetInfoMap) => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
    assets: {},
    setAssets: (assets: AssetInfoMap) => set({ assets }),
}));

export const useAssets = () => {
    const [assets, setAssets] = useAssetStore(
        useShallow((state) => [state.assets, state.setAssets]),
    );

    const isWasmReady = useWasm();
    useEffect(() => {
        if (isWasmReady && Object.keys(assets).length === 0) {
            const parsed = JSON.parse(get_available_assets()) as AssetInfoMap;
            setAssets(parsed);
        }
    }, [isWasmReady, setAssets]);

    return assets;
};
