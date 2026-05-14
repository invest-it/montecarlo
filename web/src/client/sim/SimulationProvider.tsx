import { createContext, useMemo, useRef } from "react";
import { create } from "zustand";
import {
    DEFAULT_ALLOCS,
    DEFAULT_ASSET_LABELS,
} from "./settings/assets/defaults";
import { useAssets } from "./settings/assets/data";
import { useContextStore } from "../common/hooks";
import type { InflationConfig } from "./settings/InflationSettings";
import { useWasm } from "../init-wasm";
import { reset, type AssetAllocationMap } from "./settings/assets/allocations";

interface SimulationState {
    allocations: AssetAllocationMap;
    setAllocations: (allocations: AssetAllocationMap) => void;
    portfolio: number;
    setPortfolio: (portfolio: number) => void;

    isRunning: boolean;
    setRunning: (isRunning: boolean) => void;

    selectedAssets: string[];
    setSelectedAssets: (assetLabels: string[]) => void;

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
    create<SimulationState>((set, get) => ({
        allocations: DEFAULT_ALLOCS,
        setAllocations: (allocations: AssetAllocationMap) =>
            set({ allocations }),
        portfolio: 10000,
        setPortfolio: (portfolio: number) => set({ portfolio }),
        isRunning: false,
        setRunning: (isRunning: boolean) => set({ isRunning }),

        selectedAssets: Object.values(DEFAULT_ASSET_LABELS),
        setSelectedAssets: (assetLabels: string[]) =>
            set({
                selectedAssets: assetLabels,
                allocations: reset(get().allocations),
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
    useWasm();
    return (
        <SimulationContext.Provider value={store}>
            {children}
        </SimulationContext.Provider>
    );
}

export const useSelectedAssets = () => {
    const assets = useAssets();
    const selectedAssets = useContextStore(
        SimulationContext,
        (s) => s.selectedAssets,
    );
    return useMemo(() => {
        if (Object.keys(assets).length === 0) {
            console.log("No assets available");
            return {
                byList: [],
                byIndex: [],
                byLabel: [],
            };
        }
        return {
            byList: selectedAssets.map((label) => assets[label]!),
            byIndex: selectedAssets.map((label) => {
                return assets[label]!.index;
            }),
            byLabel: selectedAssets,
        };
    }, [assets, selectedAssets]);
};
