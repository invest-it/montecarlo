export interface AssetAllocationMap {
    [label: string]: number;
}

export function reset(allocations: AssetAllocationMap): AssetAllocationMap {
    return Object.fromEntries(
        Object.entries(allocations).map(([label]) => [label, 0]),
    );
}
