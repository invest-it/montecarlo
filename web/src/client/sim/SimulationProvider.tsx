import { createContext, useMemo, useRef } from "react";
import { create } from "zustand";
import {
    DEFAULT_ALLOCS,
    DEFAULT_ASSET_INDICES,
} from "./settings/assets/defaults";
import { useAssets, type AssetInfo } from "./settings/assets/data";
import { useContextStore } from "../common/hooks";
import type { InflationConfig } from "./settings/InflationSettings";

interface SimulationState {
    allocations: number[];
    setAllocations: (allocations: number[]) => void;
    portfolio: number;
    setPortfolio: (portfolio: number) => void;

    isRunning: boolean;
    setRunning: (isRunning: boolean) => void;

    isWasmReady: boolean;
    setWasmReady: (isWasmReady: boolean) => void;

    assetIndices: number[];
    setAssetIndices: (assetIndices: number[]) => void;

    useYears: boolean;
    setUseYears: (useYears: boolean) => void;

    stepCount: number;
    setStepCount: (stepCount: number) => void;

    includeInflation: boolean;
    setIncludeInflation: (includeInflation: boolean) => void;

    seed: number;
    setSeed: (seed: number) => void;

    inflationConfig: InflationConfig | null;
    setInflationConfig: (config: InflationConfig | null) => void;
}

const createSimulationStore = () =>
    create<SimulationState>((set) => ({
        allocations: DEFAULT_ALLOCS,
        setAllocations: (allocations: number[]) => set({ allocations }),
        portfolio: 10000,
        setPortfolio: (portfolio: number) => set({ portfolio }),
        isRunning: false,
        setRunning: (isRunning: boolean) => set({ isRunning }),

        isWasmReady: false,
        setWasmReady: (isWasmReady: boolean) => set({ isWasmReady }),

        assetIndices: [...DEFAULT_ASSET_INDICES],
        setAssetIndices: (assetIndices: number[]) =>
            set({
                assetIndices,
                allocations: Array.from([
                    100,
                    ...Array(assetIndices.length - 1).fill(0),
                ]),
            }),

        useYears: false,
        setUseYears: (useYears: boolean) => set({ useYears }),

        stepCount: 2000,
        setStepCount: (stepCount: number) => set({ stepCount }),

        includeInflation: false,
        setIncludeInflation: (includeInflation: boolean) =>
            set({
                includeInflation,
            }),

        seed: Math.floor(Math.random() * 0x100000000),
        setSeed: (seed: number) => set({ seed }),

        inflationConfig: null,
        setInflationConfig: (config: InflationConfig | null) =>
            set({ inflationConfig: config }),
    }));

export const SimulationContext = createContext<ReturnType<
    typeof createSimulationStore
> | null>(null);

export function SimulationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const store = useRef(createSimulationStore()).current;
    return (
        <SimulationContext.Provider value={store}>
            {children}
        </SimulationContext.Provider>
    );
}

export const useSelectedAssets = () => {
    const assets = useAssets();
    const assetIndices = useContextStore(
        SimulationContext,
        (s) => s.assetIndices,
    );
    return useMemo(() => {
        return assets.filter((a) => assetIndices.includes(a.index));
    }, [assets, assetIndices]);
};
