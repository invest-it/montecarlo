export const ASSET_LABELS = [
    "Fonds",
    "Krypto",
    "Immobilien",
    "Anleihen",
    "Tagesgeld",
    "Rohstoffe",
];

// Default v2 LTCMA asset indices, one per legacy v1 category:
//   Fonds       → 32  AcWorldEquity
//   Krypto      → 49  VentureCapital
//   Immobilien  → 38  EuropeanCoreRealEstate
//   Anleihen    →  3  EuroAggBonds
//   Tagesgeld   →  1  EuroCash
//   Rohstoffe   → 46  Commodities
export const DEFAULT_ASSET_INDICES = [32, 49, 38, 3, 1, 46];

export const DEFAULT_ALLOCS = [20, 15, 20, 20, 15, 10];
