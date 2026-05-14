// Default v2 LTCMA asset indices (must be sorted ascending so the order
// matches useSelectedAssets(), which returns assets in Asset::ALL enum order).
//    1  EuroCash              → 15%
//    3  EuroAggBonds          → 20%
//   32  AcWorldEquity         → 20%
//   38  EuropeanCoreRealEstate → 20%
//   46  Commodities           → 10%
//   49  VentureCapital        → 15%
export const DEFAULT_ASSET_INDICES = [1, 3, 32, 38, 46, 49];

export const DEFAULT_ALLOCS = [15, 20, 20, 20, 10, 15];
