import type { AssetAllocationMap } from "./allocations";

export const DEFAULT_ASSET_LABELS: Record<number, string> = {
    1: "Euro Cash",
    3: "Euro Aggregate Bonds",
    32: "AC World Equity",
    38: "European Core Real Estate",
    46: "Commodities",
    49: "Venture Capital",
};

export const DEFAULT_ALLOCS: AssetAllocationMap = {
    "Euro Cash": 15,
    "Euro Aggregate Bonds": 20,
    "AC World Equity": 20,
    "European Core Real Estate": 20,
    Commodities: 10,
    "Venture Capital": 15,
};
