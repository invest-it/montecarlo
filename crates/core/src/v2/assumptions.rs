//! 2026 Long-Term Capital Market Assumptions – EUR
//!
//! Source: JPMorgan LTCMA 2026, EUR denomination.
//!
//! # Usage
//! ```rust
//! use market_assumptions::{Asset, MARKET};
//!
//! let selection = MARKET.select(&[Asset::EuroCash, Asset::EuropeanLargeCap, Asset::Gold]);
//!
//! let corr  = selection.correlation_matrix();
//! let cov   = selection.covariance_matrix_jittered(1e-8);
//! let chol  = cov.cholesky().expect("not positive definite");
//! let mu    = selection.mu_vec();
//! let sigma = selection.sigma_vec();
//! ```

use nalgebra::{DMatrix, DVector};

// ─── Asset enum ───────────────────────────────────────────────────────────────

/// Every asset in the 2026 EUR LTCMA universe.
///
/// The discriminant is the row/column index into [`CORR`].  Do not assign
/// explicit values — ordinal position in this enum *is* the index.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(usize)]
pub enum Asset {
    // ── Fixed Income ──────────────────────────────────────────────────────
    EuroInflation,
    EuroCash,
    UsAggBondsHedged,
    EuroAggBonds,
    UsInvGradeCorpBondsHedged,
    EuroInvGradeCorpBonds,
    UsHighYieldBondsHedged,
    EuroHighYieldBonds,
    UsLeveragedLoansHedged,
    EuroGovernmentBonds,
    EuroGovtInflationLinkedBonds,
    WorldGovernmentBondsHedged,
    WorldGovernmentBonds,
    WorldExEuroGovernmentBondsHedged,
    WorldExEuroGovernmentBonds,
    GlobalMultiverseBondsHedged,
    EmergingMarketsSovereignDebtHedged,
    EmergingMarketsLocalCurrencyDebt,
    EmergingMarketsCorpBondsHedged,
    // ── Equities ──────────────────────────────────────────────────────────
    EuropeanLargeCap,
    EuropeanSmallCap,
    UsLargeCap,
    UsLargeCapHedged,
    EuroAreaLargeCap,
    EuroAreaSmallCap,
    UkLargeCap,
    UkLargeCapHedged,
    JapaneseEquity,
    JapaneseEquityHedged,
    ChineseDomesticEquity,
    EmergingMarketsEquity,
    AcAsiaExJapanEquity,
    AcWorldEquity,
    AcWorldExEmuEquity,
    DevelopedWorldEquity,
    // ── Convertibles ──────────────────────────────────────────────────────
    GlobalConvertibleBondsHedged,
    GlobalCreditSensitiveConvertibleHedged,
    // ── Alternatives ──────────────────────────────────────────────────────
    UsCoreRealEstate,
    EuropeanCoreRealEstate,
    EuropeanValueAddedRealEstate,
    AsiaPacificCoreRealEstate,
    GlobalReits,
    CommercialMortgageLoans,
    GlobalCoreInfrastructure,
    GlobalCoreTransport,
    GlobalTimberland,
    Commodities,
    Gold,
    PrivateEquity,
    VentureCapital,
    // ── Hedge Funds ───────────────────────────────────────────────────────
    DiversifiedHedgeFundsHedged,
    EventDrivenHedgeFundsHedged,
    LongBiasHedgeFundsHedged,
    RelativeValueHedgeFundsHedged,
    MacroHedgeFundsHedged,
    DirectLending,
}

impl Asset {
    pub const COUNT: usize = 56;

    /// All assets in index order — must stay in sync with the enum variants.
    pub const ALL: [Asset; Self::COUNT] = [
        // Fixed Income
        Asset::EuroInflation,
        Asset::EuroCash,
        Asset::UsAggBondsHedged,
        Asset::EuroAggBonds,
        Asset::UsInvGradeCorpBondsHedged,
        Asset::EuroInvGradeCorpBonds,
        Asset::UsHighYieldBondsHedged,
        Asset::EuroHighYieldBonds,
        Asset::UsLeveragedLoansHedged,
        Asset::EuroGovernmentBonds,
        Asset::EuroGovtInflationLinkedBonds,
        Asset::WorldGovernmentBondsHedged,
        Asset::WorldGovernmentBonds,
        Asset::WorldExEuroGovernmentBondsHedged,
        Asset::WorldExEuroGovernmentBonds,
        Asset::GlobalMultiverseBondsHedged,
        Asset::EmergingMarketsSovereignDebtHedged,
        Asset::EmergingMarketsLocalCurrencyDebt,
        Asset::EmergingMarketsCorpBondsHedged,
        // Equities
        Asset::EuropeanLargeCap,
        Asset::EuropeanSmallCap,
        Asset::UsLargeCap,
        Asset::UsLargeCapHedged,
        Asset::EuroAreaLargeCap,
        Asset::EuroAreaSmallCap,
        Asset::UkLargeCap,
        Asset::UkLargeCapHedged,
        Asset::JapaneseEquity,
        Asset::JapaneseEquityHedged,
        Asset::ChineseDomesticEquity,
        Asset::EmergingMarketsEquity,
        Asset::AcAsiaExJapanEquity,
        Asset::AcWorldEquity,
        Asset::AcWorldExEmuEquity,
        Asset::DevelopedWorldEquity,
        // Convertibles
        Asset::GlobalConvertibleBondsHedged,
        Asset::GlobalCreditSensitiveConvertibleHedged,
        // Alternatives
        Asset::UsCoreRealEstate,
        Asset::EuropeanCoreRealEstate,
        Asset::EuropeanValueAddedRealEstate,
        Asset::AsiaPacificCoreRealEstate,
        Asset::GlobalReits,
        Asset::CommercialMortgageLoans,
        Asset::GlobalCoreInfrastructure,
        Asset::GlobalCoreTransport,
        Asset::GlobalTimberland,
        Asset::Commodities,
        Asset::Gold,
        Asset::PrivateEquity,
        Asset::VentureCapital,
        // Hedge Funds
        Asset::DiversifiedHedgeFundsHedged,
        Asset::EventDrivenHedgeFundsHedged,
        Asset::LongBiasHedgeFundsHedged,
        Asset::RelativeValueHedgeFundsHedged,
        Asset::MacroHedgeFundsHedged,
        Asset::DirectLending,
    ];

    /// Human-readable name as it appears in the source sheet.
    pub fn label(self) -> &'static str {
        PARAMS[self as usize].label
    }

    /// μ in decimal form (arithmetic return 2026 / 100).
    pub fn mu(self) -> f64 {
        PARAMS[self as usize].arithmetic_return_2026 / 100.0
    }

    /// σ in decimal form (annualised volatility / 100).
    pub fn sigma(self) -> f64 {
        PARAMS[self as usize].annualized_volatility / 100.0
    }

    /// Raw correlation between two assets.
    pub fn corr(self, other: Asset) -> f64 {
        CORR[self as usize * Asset::COUNT + other as usize]
    }
}

// Compile-time guard: ALL must be exactly COUNT long.
// If you add a variant but forget to add it to ALL, this fails to compile.
const _: () = assert!(
    Asset::ALL.len() == Asset::COUNT,
    "Asset::ALL length is out of sync with Asset::COUNT — did you add a variant?",
);

// ─── Per-asset parameters ─────────────────────────────────────────────────────

/// Return / volatility statistics for a single asset.  All values in percent.
pub struct AssetParams {
    pub label: &'static str,
    /// Geometric (compound) return, 2025 estimate (%)
    pub compound_return_2025: f64,
    /// Arithmetic return, 2026 assumption (%) — μ for your distribution
    pub arithmetic_return_2026: f64,
    /// Annualised volatility, 2026 (%) — σ for your distribution
    pub annualized_volatility: f64,
    /// Geometric (compound) return, 2026 assumption (%)
    pub compound_return_2026: f64,
}

// Indexed by Asset discriminant.
static PARAMS: &[AssetParams] = &[
    // ── Fixed Income ─────────────────────────────────────────── idx 0–18 ──
    AssetParams {
        label: "Euro Inflation",
        compound_return_2025: 2.0,
        arithmetic_return_2026: 2.008483,
        annualized_volatility: 1.315651,
        compound_return_2026: 2.0,
    },
    AssetParams {
        label: "Euro Cash",
        compound_return_2025: 2.3,
        arithmetic_return_2026: 2.301988,
        annualized_volatility: 0.637768,
        compound_return_2026: 2.4,
    },
    AssetParams {
        label: "U.S. Aggregate Bonds hedged",
        compound_return_2025: 4.0,
        arithmetic_return_2026: 4.112040,
        annualized_volatility: 4.833966,
        compound_return_2026: 3.9,
    },
    AssetParams {
        label: "Euro Aggregate Bonds",
        compound_return_2025: 3.6,
        arithmetic_return_2026: 3.706132,
        annualized_volatility: 4.695410,
        compound_return_2026: 3.3,
    },
    AssetParams {
        label: "U.S. Inv Grade Corporate Bonds hedged",
        compound_return_2025: 4.4,
        arithmetic_return_2026: 4.664276,
        annualized_volatility: 7.451899,
        compound_return_2026: 4.3,
    },
    AssetParams {
        label: "Euro Inv Grade Corp Bonds",
        compound_return_2025: 4.0,
        arithmetic_return_2026: 4.116308,
        annualized_volatility: 4.925422,
        compound_return_2026: 3.8,
    },
    AssetParams {
        label: "U.S. High Yield Bonds hedged",
        compound_return_2025: 5.3,
        arithmetic_return_2026: 5.666882,
        annualized_volatility: 8.828374,
        compound_return_2026: 5.4,
    },
    AssetParams {
        label: "Euro High Yield Bonds",
        compound_return_2025: 5.3,
        arithmetic_return_2026: 5.724040,
        annualized_volatility: 9.497620,
        compound_return_2026: 5.3,
    },
    AssetParams {
        label: "U.S. Leveraged Loans hedged",
        compound_return_2025: 5.8,
        arithmetic_return_2026: 6.081115,
        annualized_volatility: 7.738208,
        compound_return_2026: 5.9,
    },
    AssetParams {
        label: "Euro Government Bonds",
        compound_return_2025: 3.4,
        arithmetic_return_2026: 3.537213,
        annualized_volatility: 5.335711,
        compound_return_2026: 3.1,
    },
    AssetParams {
        label: "Euro Govt Inflation-Linked Bonds",
        compound_return_2025: 3.6,
        arithmetic_return_2026: 3.771963,
        annualized_volatility: 5.981537,
        compound_return_2026: 3.3,
    },
    AssetParams {
        label: "World Government Bonds hedged",
        compound_return_2025: 3.5,
        arithmetic_return_2026: 3.578356,
        annualized_volatility: 4.031176,
        compound_return_2026: 3.2,
    },
    AssetParams {
        label: "World Government Bonds",
        compound_return_2025: 3.7,
        arithmetic_return_2026: 3.928981,
        annualized_volatility: 6.910383,
        compound_return_2026: 3.0,
    },
    AssetParams {
        label: "World ex-Euro Government Bonds hedged",
        compound_return_2025: 3.5,
        arithmetic_return_2026: 3.577817,
        annualized_volatility: 4.017271,
        compound_return_2026: 3.3,
    },
    AssetParams {
        label: "World ex-Euro Government Bonds",
        compound_return_2025: 3.9,
        arithmetic_return_2026: 4.292911,
        annualized_volatility: 9.078606,
        compound_return_2026: 2.9,
    },
    AssetParams {
        label: "Global Multiverse Bonds hedged",
        compound_return_2025: 3.8,
        arithmetic_return_2026: 3.872462,
        annualized_volatility: 3.881933,
        compound_return_2026: 3.6,
    },
    AssetParams {
        label: "Emerging Markets Sovereign Debt hedged",
        compound_return_2025: 5.5,
        arithmetic_return_2026: 5.876723,
        annualized_volatility: 8.955452,
        compound_return_2026: 5.1,
    },
    AssetParams {
        label: "Emerging Markets Local Currency Debt",
        compound_return_2025: 6.1,
        arithmetic_return_2026: 6.448647,
        annualized_volatility: 8.636681,
        compound_return_2026: 4.9,
    },
    AssetParams {
        label: "Emerging Markets Corporate Bonds hedged",
        compound_return_2025: 5.3,
        arithmetic_return_2026: 5.577027,
        annualized_volatility: 7.663312,
        compound_return_2026: 5.5,
    },
    // ── Equities ─────────────────────────────────────────────── idx 19–34 ──
    AssetParams {
        label: "European Large Cap",
        compound_return_2025: 6.4,
        arithmetic_return_2026: 7.426945,
        annualized_volatility: 14.961542,
        compound_return_2026: 6.6,
    },
    AssetParams {
        label: "European Small Cap",
        compound_return_2025: 7.2,
        arithmetic_return_2026: 8.676197,
        annualized_volatility: 18.097317,
        compound_return_2026: 7.4,
    },
    AssetParams {
        label: "U.S. Large Cap",
        compound_return_2025: 6.1,
        arithmetic_return_2026: 7.194983,
        annualized_volatility: 15.440209,
        compound_return_2026: 5.5,
    },
    AssetParams {
        label: "U.S. Large Cap hedged",
        compound_return_2025: 5.9,
        arithmetic_return_2026: 7.150562,
        annualized_volatility: 16.515529,
        compound_return_2026: 5.9,
    },
    AssetParams {
        label: "Euro Area Large Cap",
        compound_return_2025: 7.2,
        arithmetic_return_2026: 8.526983,
        annualized_volatility: 17.128836,
        compound_return_2026: 7.3,
    },
    AssetParams {
        label: "Euro Area Small Cap",
        compound_return_2025: 7.8,
        arithmetic_return_2026: 9.271259,
        annualized_volatility: 18.114773,
        compound_return_2026: 7.7,
    },
    AssetParams {
        label: "UK Large Cap",
        compound_return_2025: 6.0,
        arithmetic_return_2026: 7.006787,
        annualized_volatility: 14.783284,
        compound_return_2026: 6.6,
    },
    AssetParams {
        label: "UK Large Cap hedged",
        compound_return_2025: 5.5,
        arithmetic_return_2026: 6.314044,
        annualized_volatility: 13.232423,
        compound_return_2026: 6.5,
    },
    AssetParams {
        label: "Japanese Equity",
        compound_return_2025: 8.2,
        arithmetic_return_2026: 9.121071,
        annualized_volatility: 14.268518,
        compound_return_2026: 7.8,
    },
    AssetParams {
        label: "Japanese Equity hedged",
        compound_return_2025: 7.9,
        arithmetic_return_2026: 9.215882,
        annualized_volatility: 17.108764,
        compound_return_2026: 8.3,
    },
    AssetParams {
        label: "Chinese Domestic Equity",
        compound_return_2025: 7.1,
        arithmetic_return_2026: 10.379373,
        annualized_volatility: 27.523451,
        compound_return_2026: 6.6,
    },
    AssetParams {
        label: "Emerging Markets Equity",
        compound_return_2025: 7.2,
        arithmetic_return_2026: 8.475506,
        annualized_volatility: 16.783348,
        compound_return_2026: 6.0,
    },
    AssetParams {
        label: "AC Asia ex-Japan Equity",
        compound_return_2025: 7.3,
        arithmetic_return_2026: 8.655623,
        annualized_volatility: 17.326232,
        compound_return_2026: 6.0,
    },
    AssetParams {
        label: "AC World Equity",
        compound_return_2025: 6.4,
        arithmetic_return_2026: 7.350871,
        annualized_volatility: 14.383969,
        compound_return_2026: 5.9,
    },
    AssetParams {
        label: "AC World ex-EMU Equity",
        compound_return_2025: 6.3,
        arithmetic_return_2026: 7.251735,
        annualized_volatility: 14.384032,
        compound_return_2026: 5.8,
    },
    AssetParams {
        label: "Developed World Equity",
        compound_return_2025: 6.3,
        arithmetic_return_2026: 7.291896,
        annualized_volatility: 14.691264,
        compound_return_2026: 5.9,
    },
    // ── Convertibles ─────────────────────────────────────────── idx 35–36 ──
    AssetParams {
        label: "Global Convertible Bonds hedged",
        compound_return_2025: 5.9,
        arithmetic_return_2026: 6.489389,
        annualized_volatility: 11.250655,
        compound_return_2026: 6.0,
    },
    AssetParams {
        label: "Global Credit Sensitive Convertible hedged",
        compound_return_2025: 4.1,
        arithmetic_return_2026: 4.375731,
        annualized_volatility: 7.601850,
        compound_return_2026: 4.2,
    },
    // ── Alternatives ─────────────────────────────────────────── idx 37–49 ──
    AssetParams {
        label: "U.S. Core Real Estate",
        compound_return_2025: 7.6,
        arithmetic_return_2026: 8.417860,
        annualized_volatility: 13.392849,
        compound_return_2026: 6.9,
    },
    AssetParams {
        label: "European Core Real Estate",
        compound_return_2025: 6.3,
        arithmetic_return_2026: 6.844670,
        annualized_volatility: 10.829876,
        compound_return_2026: 6.4,
    },
    AssetParams {
        label: "European Value-Added Real Estate",
        compound_return_2025: 8.4,
        arithmetic_return_2026: 9.803347,
        annualized_volatility: 17.725541,
        compound_return_2026: 8.5,
    },
    AssetParams {
        label: "Asia Pacific Core Real Estate",
        compound_return_2025: 7.8,
        arithmetic_return_2026: 8.717615,
        annualized_volatility: 14.215363,
        compound_return_2026: 6.9,
    },
    AssetParams {
        label: "Global REITs",
        compound_return_2025: 8.1,
        arithmetic_return_2026: 8.951876,
        annualized_volatility: 13.704997,
        compound_return_2026: 6.8,
    },
    AssetParams {
        label: "Commercial Mortgage Loans",
        compound_return_2025: 5.6,
        arithmetic_return_2026: 6.329490,
        annualized_volatility: 12.519739,
        compound_return_2026: 5.2,
    },
    AssetParams {
        label: "Global Core Infrastructure",
        compound_return_2025: 5.9,
        arithmetic_return_2026: 6.512910,
        annualized_volatility: 11.476118,
        compound_return_2026: 5.1,
    },
    AssetParams {
        label: "Global Core Transport",
        compound_return_2025: 7.3,
        arithmetic_return_2026: 8.049809,
        annualized_volatility: 12.795932,
        compound_return_2026: 6.6,
    },
    AssetParams {
        label: "Global Timberland",
        compound_return_2025: 5.7,
        arithmetic_return_2026: 6.317827,
        annualized_volatility: 11.512001,
        compound_return_2026: 4.1,
    },
    AssetParams {
        label: "Commodities",
        compound_return_2025: 4.0,
        arithmetic_return_2026: 5.318850,
        annualized_volatility: 16.825761,
        compound_return_2026: 2.6,
    },
    AssetParams {
        label: "Gold",
        compound_return_2025: 4.9,
        arithmetic_return_2026: 6.033255,
        annualized_volatility: 15.627983,
        compound_return_2026: 2.8,
    },
    AssetParams {
        label: "Private Equity",
        compound_return_2025: 9.6,
        arithmetic_return_2026: 11.095956,
        annualized_volatility: 18.418080,
        compound_return_2026: 8.7,
    },
    AssetParams {
        label: "Venture Capital",
        compound_return_2025: 7.9,
        arithmetic_return_2026: 10.040368,
        annualized_volatility: 22.026409,
        compound_return_2026: 7.6,
    },
    // ── Hedge Funds ──────────────────────────────────────────── idx 50–55 ──
    AssetParams {
        label: "Diversified Hedge Funds hedged",
        compound_return_2025: 4.5,
        arithmetic_return_2026: 4.653001,
        annualized_volatility: 5.665199,
        compound_return_2026: 4.2,
    },
    AssetParams {
        label: "Event Driven Hedge Funds hedged",
        compound_return_2025: 4.4,
        arithmetic_return_2026: 4.702842,
        annualized_volatility: 7.980789,
        compound_return_2026: 4.2,
    },
    AssetParams {
        label: "Long Bias Hedge Funds hedged",
        compound_return_2025: 4.7,
        arithmetic_return_2026: 5.279349,
        annualized_volatility: 11.090595,
        compound_return_2026: 4.3,
    },
    AssetParams {
        label: "Relative Value Hedge Funds hedged",
        compound_return_2025: 4.9,
        arithmetic_return_2026: 5.037318,
        annualized_volatility: 5.376221,
        compound_return_2026: 4.3,
    },
    AssetParams {
        label: "Macro Hedge Funds hedged",
        compound_return_2025: 3.3,
        arithmetic_return_2026: 3.533738,
        annualized_volatility: 6.968787,
        compound_return_2026: 3.1,
    },
    AssetParams {
        label: "Direct Lending",
        compound_return_2025: 7.1,
        arithmetic_return_2026: 8.169255,
        annualized_volatility: 15.323081,
        compound_return_2026: 7.0,
    },
];

// ─── Correlation matrix ───────────────────────────────────────────────────────

// Full symmetric 56×56 matrix stored row-major.
// Row i = Asset::ALL[i].  Entry [i * COUNT + j] = ρ(i, j).
//
// Each row is one asset; columns follow the same order as the enum.
// Diagonal entries are always 1.0.
#[rustfmt::skip]
static CORR: &[f64] = &[
    //                    EuroInfl  EuroCash  UsAggBH   EuroAggB  UsIGCBH   EuroIGCB  UsHYBH    EuroHYB   UsLevLH   EuroGovB  EuroGovIL WGovBH    WGovB     WxEGovBH  WxEGovB   GlMulBH   EMSovDH   EMLocCD   EMCorBH   EuroLgCp  EuroSmCp  UsLgCp    UsLgCpH   EALgCp    EASmCp    UkLgCp    UkLgCpH   JpnEq     JpnEqH    ChnDomEq  EMEq      AcAxJpEq  AcWldEq   AcWxEMU   DevWldEq  GlCvBH    GlCrSCvH  UsCoreRE  EuCoreRE  EuVARE    ApCoreRE  GlREITs   CommMtgL  GlCoreInf GlCoreTr  GlTimb    Commod    Gold      PrivEq    VentCap   DivHFH    EvDrHFH   LBiasHFH  RelValHF  MacroHFH  DirLend
    // 0  EuroInflation
     1.000000,-0.079803,-0.299273,-0.268592,-0.276443,-0.230276,-0.049027,-0.039685, 0.046610,-0.246585,-0.045576,-0.276179,-0.153794,-0.266800,-0.119956,-0.284285,-0.244783,-0.056742,-0.236404, 0.022206,-0.051485, 0.060067, 0.009176, 0.003136,-0.040588, 0.078480, 0.016917,-0.037996, 0.065214,-0.126192,-0.064726,-0.119292, 0.033618, 0.033696, 0.046021,-0.146586,-0.010468, 0.127869, 0.129929, 0.167767, 0.115529,-0.030155,-0.030195, 0.220039, 0.255928, 0.188321, 0.253783,-0.008318, 0.043866,-0.124020,-0.029928, 0.025710,-0.049969, 0.037044, 0.046943, 0.102551,
    // 1  EuroCash
    -0.079803, 1.000000, 0.170595, 0.202205, 0.080753, 0.088100,-0.022211,-0.047582,-0.087473, 0.199468, 0.112113, 0.220871, 0.152511, 0.154715, 0.121028, 0.213188, 0.069901, 0.103532, 0.012249,-0.147718,-0.140177,-0.169772,-0.132678,-0.114382,-0.124163,-0.179237,-0.090250,-0.100988,-0.124513,-0.013194,-0.085078,-0.085229,-0.154830,-0.157510,-0.162246,-0.044687,-0.157521,-0.312617,-0.279618,-0.271088,-0.360756,-0.171152,-0.058692,-0.168570,-0.080004, 0.001853,-0.152517, 0.103041,-0.202085,-0.199375,-0.116586,-0.102909,-0.073098,-0.046906, 0.097506,-0.130484,
    // 2  UsAggBondsHedged
    -0.299273, 0.170595, 1.000000, 0.751231, 0.865902, 0.653368, 0.403708, 0.249686, 0.067698, 0.725676, 0.537623, 0.871601, 0.401489, 0.873929, 0.267321, 0.948537, 0.669361, 0.333511, 0.578205, 0.198857, 0.221135, 0.114776, 0.290189, 0.224912, 0.202899, 0.078205, 0.163397, 0.162536,-0.023930, 0.093650, 0.206785, 0.244154, 0.167332, 0.157214, 0.155366, 0.343122, 0.245402,-0.161329,-0.199698,-0.307885,-0.066991, 0.307363, 0.015900,-0.159871,-0.251935,-0.175798,-0.183371, 0.206518,-0.135713,-0.047808, 0.070330, 0.162433, 0.237963, 0.158359,-0.107475,-0.179681,
    // 3  EuroAggBonds
    -0.268592, 0.202205, 0.751231, 1.000000, 0.717405, 0.825321, 0.342408, 0.335252, 0.097497, 0.981803, 0.762435, 0.876161, 0.565149, 0.699287, 0.377425, 0.896860, 0.559803, 0.401526, 0.448670, 0.259607, 0.272028, 0.276609, 0.314872, 0.268400, 0.237163, 0.158841, 0.161910, 0.275461, 0.048489, 0.101334, 0.214083, 0.235786, 0.289418, 0.286717, 0.287026, 0.352495, 0.305871,-0.121649,-0.155595,-0.277191,-0.068813, 0.375810, 0.075779,-0.095509,-0.210165,-0.104738,-0.147569, 0.129236,-0.062514, 0.030002, 0.083033, 0.170076, 0.206599, 0.148021,-0.067024,-0.063629,
    // 4  UsInvGradeCorpBondsHedged
    -0.276443, 0.080753, 0.865902, 0.717405, 1.000000, 0.837420, 0.652277, 0.531228, 0.360524, 0.632884, 0.601374, 0.678549, 0.266459, 0.639520, 0.115785, 0.870406, 0.814532, 0.451996, 0.786035, 0.430579, 0.471130, 0.307274, 0.499976, 0.436835, 0.443060, 0.329499, 0.374107, 0.362917, 0.199921, 0.199962, 0.452964, 0.470532, 0.408587, 0.395614, 0.388597, 0.616340, 0.450507,-0.085214,-0.020789,-0.111850, 0.176916, 0.486759,-0.081785,-0.014724,-0.442683,-0.147644,-0.005153, 0.134763, 0.181464, 0.143889, 0.354718, 0.426340, 0.496615, 0.440844, 0.009855,-0.192779,
    // 5  EuroInvGradeCorpBonds
    -0.230276, 0.088100, 0.653368, 0.825321, 0.837420, 1.000000, 0.653932, 0.681178, 0.463444, 0.721075, 0.726717, 0.599697, 0.308174, 0.447126, 0.137438, 0.783445, 0.726250, 0.508234, 0.705422, 0.547161, 0.585723, 0.478496, 0.570992, 0.530910, 0.529243, 0.471303, 0.430189, 0.475413, 0.306652, 0.212259, 0.507589, 0.506261, 0.557597, 0.548613, 0.543113, 0.649956, 0.518436, 0.012245, 0.062521,-0.026237, 0.239874, 0.576880,-0.056064, 0.071664,-0.401215,-0.080635, 0.073549, 0.073155, 0.298043, 0.237305, 0.413382, 0.507282, 0.533324, 0.513936, 0.016898,-0.105659,
    // 6  UsHighYieldBondsHedged
    -0.049027,-0.022211, 0.403708, 0.342408, 0.652277, 0.653932, 1.000000, 0.867219, 0.774258, 0.230779, 0.465451, 0.160582,-0.103951, 0.094413,-0.215369, 0.448003, 0.748668, 0.467229, 0.733424, 0.710932, 0.750100, 0.583065, 0.737837, 0.699464, 0.724979, 0.629120, 0.609869, 0.518591, 0.518973, 0.244620, 0.672143, 0.625517, 0.690648, 0.674789, 0.670015, 0.805459, 0.617555, 0.218073, 0.364920, 0.329028, 0.506440, 0.666147,-0.091505, 0.300231,-0.364672,-0.034082, 0.279881,-0.057398, 0.567413, 0.416308, 0.625901, 0.779183, 0.767874, 0.818946, 0.063349,-0.039760,
    // 7  EuroHighYieldBonds
    -0.039685,-0.047582, 0.249686, 0.335252, 0.531228, 0.681178, 0.867219, 1.000000, 0.863670, 0.212715, 0.422653, 0.049147,-0.074587,-0.070592,-0.165905, 0.338980, 0.600668, 0.466669, 0.640932, 0.763755, 0.801571, 0.612986, 0.669737, 0.731764, 0.772591, 0.727897, 0.606629, 0.567598, 0.555036, 0.290901, 0.694416, 0.647900, 0.732492, 0.718019, 0.710165, 0.756638, 0.648058, 0.240035, 0.360602, 0.331387, 0.521051, 0.668408,-0.079708, 0.339427,-0.320623,-0.004314, 0.286437,-0.089225, 0.565564, 0.366041, 0.664306, 0.779853, 0.735343, 0.837878, 0.086912,-0.017795,
    // 8  UsLeveragedLoansHedged
     0.046610,-0.087473, 0.067698, 0.097497, 0.360524, 0.463444, 0.774258, 0.863670, 1.000000,-0.018201, 0.226461,-0.155872,-0.159567,-0.244751,-0.215835, 0.129352, 0.456432, 0.393342, 0.558769, 0.641720, 0.684880, 0.562396, 0.567920, 0.591278, 0.647864, 0.664259, 0.523980, 0.498076, 0.518370, 0.277144, 0.638709, 0.584880, 0.657361, 0.654171, 0.637758, 0.676289, 0.653272, 0.345247, 0.475436, 0.465666, 0.578668, 0.564343, 0.016942, 0.465026,-0.203890, 0.057961, 0.391829,-0.083002, 0.630983, 0.443763, 0.680065, 0.764670, 0.681369, 0.866461, 0.069578, 0.101970,
    // 9  EuroGovernmentBonds
    -0.246585, 0.199468, 0.725676, 0.981803, 0.632884, 0.721075, 0.230779, 0.212715,-0.018201, 1.000000, 0.739424, 0.900375, 0.588185, 0.728268, 0.402439, 0.865056, 0.472598, 0.345607, 0.343558, 0.173079, 0.170700, 0.212009, 0.236383, 0.189653, 0.147904, 0.069719, 0.089134, 0.209098,-0.008493, 0.073571, 0.122236, 0.149155, 0.205715, 0.204148, 0.207780, 0.252829, 0.221192,-0.143188,-0.192618,-0.316078,-0.149280, 0.308896, 0.103052,-0.126763,-0.131417,-0.102947,-0.202381, 0.134108,-0.159048,-0.029697,-0.020117, 0.064246, 0.105472, 0.030823,-0.091127,-0.049174,
    // 10 EuroGovtInflationLinkedBonds
    -0.045576, 0.112113, 0.537623, 0.762435, 0.601374, 0.726717, 0.465451, 0.422653, 0.226461, 0.739424, 1.000000, 0.587750, 0.276036, 0.429982, 0.111945, 0.678565, 0.561491, 0.381168, 0.428207, 0.428597, 0.425697, 0.366930, 0.452793, 0.435490, 0.416847, 0.325265, 0.362553, 0.334115, 0.244282, 0.053290, 0.331967, 0.310700, 0.417469, 0.405096, 0.413864, 0.460839, 0.264211,-0.017326, 0.033725,-0.050519, 0.084673, 0.494374,-0.054937, 0.070592,-0.243728,-0.017287, 0.140057, 0.091422, 0.140084, 0.081226, 0.240521, 0.332178, 0.355077, 0.312904, 0.130056,-0.088808,
    // 11 WorldGovernmentBondsHedged
    -0.276179, 0.220871, 0.871601, 0.876161, 0.678549, 0.599697, 0.160582, 0.049147,-0.155872, 0.900375, 0.587750, 1.000000, 0.613833, 0.946829, 0.462281, 0.921627, 0.463863, 0.265795, 0.330347, 0.033545, 0.041175, 0.061742, 0.135880, 0.058373, 0.018405,-0.090345,-0.016045, 0.065675,-0.168431,-0.000785, 0.013948, 0.055823, 0.050307, 0.047738, 0.051899, 0.137636, 0.117442,-0.175605,-0.263257,-0.389474,-0.225356, 0.208395, 0.114769,-0.219517,-0.076237,-0.134910,-0.302779, 0.205689,-0.300164,-0.132673,-0.135702,-0.060024, 0.004260,-0.093473,-0.123537,-0.106502,
    // 12 WorldGovernmentBonds
    -0.153794, 0.152511, 0.401489, 0.565149, 0.266459, 0.308174,-0.103951,-0.074587,-0.159567, 0.588185, 0.276036, 0.613833, 1.000000, 0.547790, 0.960907, 0.488981, -0.006312, 0.301169,-0.036976,-0.118238,-0.109783, 0.163629,-0.192579,-0.191143,-0.203654,-0.064947,-0.242792, 0.181423,-0.375935,-0.002314,-0.116890,-0.063194, 0.059907, 0.093581, 0.079815,-0.178663,-0.019492, 0.092836,-0.167453,-0.248777,-0.000461, 0.158702, 0.614681, 0.105863, 0.364984, 0.303401,-0.082212, 0.334615,-0.143456,-0.037657,-0.274263,-0.271239,-0.304016,-0.246777,-0.110483, 0.462127,
    // 13 WorldExEuroGovernmentBondsHedged
    -0.266800, 0.154715, 0.873929, 0.699287, 0.639520, 0.447126, 0.094413,-0.070592,-0.244751, 0.728268, 0.429982, 0.946829, 0.547790, 1.000000, 0.436664, 0.849399, 0.413910, 0.157541, 0.284376,-0.061328,-0.045668,-0.056609, 0.053049,-0.033068,-0.063153,-0.185316,-0.076852,-0.039819,-0.257997,-0.063185,-0.070779,-0.020761,-0.066344,-0.070868,-0.064405, 0.043653, 0.033085,-0.191739,-0.292334,-0.406488,-0.238612, 0.118395, 0.091088,-0.258364,-0.044129,-0.152214,-0.332124, 0.228731,-0.371177,-0.205489,-0.197293,-0.136947,-0.064794,-0.175028,-0.130646,-0.147156,
    // 14 WorldExEuroGovernmentBonds
    -0.119956, 0.121028, 0.267321, 0.377425, 0.115785, 0.137438,-0.215369,-0.165905,-0.215835, 0.402439, 0.111945, 0.462281, 0.960907, 0.436664, 1.000000, 0.319913,-0.160508, 0.204318,-0.167402,-0.212252,-0.209375, 0.085406,-0.322967,-0.294080,-0.304721,-0.126815,-0.323245, 0.123358,-0.451181,-0.028796,-0.206918,-0.141032,-0.036447, 0.002006,-0.013889,-0.316197,-0.135760, 0.122946,-0.191850,-0.249006, 0.006060, 0.066854, 0.657373, 0.114432, 0.457325, 0.352835,-0.072423, 0.337280,-0.171810,-0.083687,-0.359668,-0.372129,-0.421577,-0.331448,-0.135058, 0.522903,
    // 15 GlobalMultiverseBondsHedged
    -0.284285, 0.213188, 0.948537, 0.896860, 0.870406, 0.783445, 0.448003, 0.338980, 0.129352, 0.865056, 0.678565, 0.921627, 0.488981, 0.849399, 0.319913, 1.000000, 0.695265, 0.427571, 0.586178, 0.274263, 0.295566, 0.226112, 0.353808, 0.295685, 0.270472, 0.146588, 0.216717, 0.238066, 0.028763, 0.102022, 0.252006, 0.279225, 0.267217, 0.258207, 0.258814, 0.401515, 0.300571,-0.148711,-0.176540,-0.295941,-0.042332, 0.392539, 0.048017,-0.112344,-0.249700,-0.131794,-0.157258, 0.189255,-0.067720, 0.014265, 0.114461, 0.215933, 0.275314, 0.206802,-0.070419,-0.133910,
    // 16 EmergingMarketsSovereignDebtHedged
    -0.244783, 0.069901, 0.669361, 0.559803, 0.814532, 0.726250, 0.748668, 0.600668, 0.456432, 0.472598, 0.561491, 0.463863,-0.006312, 0.413910,-0.160508, 0.695265, 1.000000, 0.566627, 0.898573, 0.554576, 0.568750, 0.372270, 0.627361, 0.580141, 0.564066, 0.429131, 0.530500, 0.352613, 0.342610, 0.205345, 0.581835, 0.555493, 0.489938, 0.468821, 0.462315, 0.697945, 0.547590,-0.008894, 0.110656, 0.043416, 0.276794, 0.520800,-0.131611, 0.139652,-0.459009,-0.110044, 0.076887, 0.049512, 0.369772, 0.298450, 0.459867, 0.574246, 0.622819, 0.592994, 0.032831,-0.195837,
    // 17 EmergingMarketsLocalCurrencyDebt
    -0.056742, 0.103532, 0.333511, 0.401526, 0.451996, 0.508234, 0.467229, 0.466669, 0.393342, 0.345607, 0.381168, 0.265795, 0.301169, 0.157541, 0.204318, 0.427571, 0.566627, 1.000000, 0.545439, 0.486878, 0.419693, 0.498368, 0.393841, 0.449787, 0.396488, 0.478295, 0.418485, 0.517113, 0.312274, 0.265245, 0.629908, 0.592672, 0.564630, 0.570633, 0.535229, 0.421674, 0.327434, 0.236169, 0.169803, 0.123927, 0.391623, 0.580761, 0.334323, 0.356406, 0.057254, 0.327093, 0.230516, 0.224147, 0.463580, 0.347878, 0.293984, 0.380074, 0.385807, 0.457850, 0.038685, 0.329432,
    // 18 EmergingMarketsCorpBondsHedged
    -0.236404, 0.012249, 0.578205, 0.448670, 0.786035, 0.705422, 0.733424, 0.640932, 0.558769, 0.343558, 0.428207, 0.330347,-0.036976, 0.284376,-0.167402, 0.586178, 0.898573, 0.545439, 1.000000, 0.534814, 0.560841, 0.350661, 0.564838, 0.543497, 0.551379, 0.458266, 0.501329, 0.377745, 0.362768, 0.296889, 0.627725, 0.615748, 0.482271, 0.464820, 0.448313, 0.692184, 0.651357, 0.118328, 0.249755, 0.191667, 0.387448, 0.480115,-0.094659, 0.196081,-0.412296,-0.094547, 0.124565, 0.070955, 0.439594, 0.339360, 0.498030, 0.584433, 0.620651, 0.646138, 0.011386,-0.132167,
    // 19 EuropeanLargeCap
     0.022206,-0.147718, 0.198857, 0.259607, 0.430579, 0.547161, 0.710932, 0.763755, 0.641720, 0.173079, 0.428597, 0.033545,-0.118238,-0.061328,-0.212252, 0.274263, 0.554576, 0.486878, 0.534814, 1.000000, 0.924301, 0.801549, 0.843645, 0.974447, 0.919274, 0.924820, 0.862206, 0.690325, 0.720301, 0.270984, 0.734586, 0.687390, 0.906106, 0.877782, 0.898356, 0.780727, 0.589405, 0.276154, 0.406322, 0.391524, 0.536221, 0.790169,-0.063082, 0.277726,-0.187172, 0.155573, 0.311806,-0.156638, 0.682771, 0.485153, 0.695827, 0.787287, 0.797946, 0.724141, 0.160432, 0.064144,
    // 20 EuropeanSmallCap
    -0.051485,-0.140177, 0.221135, 0.272028, 0.471130, 0.585723, 0.750100, 0.801571, 0.684880, 0.170700, 0.425697, 0.041175,-0.109783,-0.045668,-0.209375, 0.295566, 0.568750, 0.419693, 0.560841, 0.924301, 1.000000, 0.750722, 0.815137, 0.893892, 0.964272, 0.852124, 0.776202, 0.657694, 0.665980, 0.281316, 0.717796, 0.669057, 0.860569, 0.837295, 0.850331, 0.827430, 0.626559, 0.245772, 0.400782, 0.386391, 0.533978, 0.753090,-0.120761, 0.245115,-0.321818, 0.062057, 0.296740,-0.140113, 0.682208, 0.511585, 0.762729, 0.852194, 0.846584, 0.770304, 0.169865,-0.001537,
    // 21 UsLargeCap
     0.060067,-0.169772, 0.114776, 0.276609, 0.307274, 0.478496, 0.583065, 0.612986, 0.562396, 0.212009, 0.366930, 0.061742, 0.163629,-0.056609, 0.085406, 0.226112, 0.372270, 0.498368, 0.350661, 0.801549, 0.750722, 1.000000, 0.828124, 0.740699, 0.680837, 0.766132, 0.618837, 0.716579, 0.617609, 0.273267, 0.617005, 0.587123, 0.958303, 0.966604, 0.972588, 0.674496, 0.503027, 0.439906, 0.473039, 0.456372, 0.518688, 0.800888, 0.267281, 0.407959, 0.105225, 0.368865, 0.324041,-0.083506, 0.720615, 0.611979, 0.577032, 0.659585, 0.663558, 0.567770, 0.063295, 0.385497,
    // 22 UsLargeCapHedged
     0.009176,-0.132678, 0.290189, 0.314872, 0.499976, 0.570992, 0.737837, 0.669737, 0.567920, 0.236383, 0.452793, 0.135880,-0.192579, 0.053049,-0.322967, 0.353808, 0.627361, 0.393841, 0.564838, 0.843645, 0.815137, 0.828124, 1.000000, 0.844525, 0.798881, 0.717393, 0.743467, 0.573813, 0.684201, 0.219439, 0.677622, 0.622299, 0.872050, 0.853628, 0.868997, 0.850049, 0.604366, 0.228343, 0.396302, 0.375368, 0.407562, 0.740456,-0.207788, 0.175277,-0.274681, 0.007945, 0.235738,-0.187443, 0.606706, 0.495551, 0.677890, 0.801335, 0.868692, 0.668773, 0.121901,-0.102681,
    // 23 EuroAreaLargeCap
     0.003136,-0.114382, 0.224912, 0.268400, 0.436835, 0.530910, 0.699464, 0.731764, 0.591278, 0.189653, 0.435490, 0.058373,-0.191143,-0.033068,-0.294080, 0.295685, 0.580141, 0.449787, 0.543497, 0.974447, 0.893892, 0.740699, 0.844525, 1.000000, 0.928901, 0.840730, 0.844048, 0.637103, 0.721155, 0.248133, 0.706652, 0.659024, 0.852235, 0.813789, 0.843179, 0.785800, 0.563757, 0.174299, 0.333313, 0.315199, 0.439323, 0.727147,-0.157353, 0.206109,-0.231019, 0.085645, 0.216661,-0.205485, 0.619749, 0.450169, 0.664298, 0.767242, 0.796812, 0.689234, 0.142854,-0.043278,
    // 24 EuroAreaSmallCap
    -0.040588,-0.124163, 0.202899, 0.237163, 0.443060, 0.529243, 0.724979, 0.772591, 0.647864, 0.147904, 0.416847, 0.018405,-0.203654,-0.063153,-0.304721, 0.270472, 0.564066, 0.396488, 0.551379, 0.919274, 0.964272, 0.680837, 0.798881, 0.928901, 1.000000, 0.809277, 0.814573, 0.611737, 0.678592, 0.253937, 0.707170, 0.652495, 0.810055, 0.775895, 0.795882, 0.814185, 0.595316, 0.175066, 0.350040, 0.335765, 0.484940, 0.707305,-0.208480, 0.164113,-0.333948, 0.022941, 0.253367,-0.173926, 0.617028, 0.428976, 0.735862, 0.837966, 0.836839, 0.756901, 0.211719,-0.082027,
    // 25 UkLargeCap
     0.078480,-0.179237, 0.078205, 0.158841, 0.329499, 0.471303, 0.629120, 0.727897, 0.664259, 0.069719, 0.325265,-0.090345,-0.064947,-0.185316,-0.126815, 0.146588, 0.429131, 0.478295, 0.458266, 0.924820, 0.852124, 0.766132, 0.717393, 0.840730, 0.809277, 1.000000, 0.841514, 0.688179, 0.656372, 0.303837, 0.711755, 0.668798, 0.863082, 0.849731, 0.854103, 0.667053, 0.551831, 0.371024, 0.479134, 0.484894, 0.607283, 0.749808, 0.035729, 0.384051,-0.124072, 0.239632, 0.462035,-0.074054, 0.705614, 0.479580, 0.656845, 0.734448, 0.708323, 0.711733, 0.185687, 0.191431,
    // 26 UkLargeCapHedged
     0.016917,-0.090250, 0.163397, 0.161910, 0.374107, 0.430189, 0.609869, 0.606629, 0.523980, 0.089134, 0.362553,-0.016045,-0.242792,-0.076852,-0.323245, 0.216717, 0.530500, 0.418485, 0.501329, 0.862206, 0.776202, 0.618837, 0.743467, 0.844048, 0.814573, 0.841514, 1.000000, 0.527361, 0.613555, 0.191803, 0.668575, 0.612446, 0.741256, 0.710772, 0.725802, 0.695176, 0.445482, 0.133774, 0.294202, 0.299645, 0.446760, 0.674037,-0.204499, 0.104633,-0.269310, 0.116156, 0.337288,-0.145746, 0.564530, 0.335649, 0.597141, 0.703751, 0.717230, 0.651315, 0.266626,-0.052576,
    // 27 JapaneseEquity
    -0.037996,-0.100988, 0.162536, 0.275461, 0.362917, 0.475413, 0.518591, 0.567598, 0.498076, 0.209098, 0.334115, 0.065675, 0.181423,-0.039819, 0.123358, 0.238066, 0.352613, 0.517113, 0.377745, 0.690325, 0.657694, 0.716579, 0.573813, 0.637103, 0.611737, 0.688179, 0.527361, 1.000000, 0.771927, 0.260417, 0.581158, 0.572886, 0.777650, 0.781932, 0.777282, 0.578911, 0.418911, 0.340248, 0.325971, 0.334139, 0.446109, 0.648196, 0.197773, 0.373167,-0.007717, 0.291982, 0.239349,-0.091507, 0.514984, 0.463010, 0.503792, 0.556103, 0.567081, 0.538172, 0.028412, 0.303062,
    // 28 JapaneseEquityHedged
     0.065214,-0.124513,-0.023930, 0.048489, 0.199921, 0.306652, 0.518973, 0.555036, 0.518370,-0.008493, 0.244282,-0.168431,-0.375935,-0.257997,-0.451181, 0.028763, 0.342610, 0.312274, 0.362768, 0.720301, 0.665980, 0.617609, 0.684201, 0.721155, 0.678592, 0.656372, 0.613555, 0.771927, 1.000000, 0.250001, 0.590153, 0.550952, 0.715076, 0.698504, 0.707058, 0.649726, 0.409675, 0.280746, 0.444913, 0.479400, 0.332212, 0.534683,-0.113946, 0.268088,-0.149967, 0.094871, 0.218251,-0.300836, 0.523572, 0.451174, 0.619393, 0.658032, 0.695369, 0.616776, 0.102731, 0.034089,
    // 29 ChineseDomesticEquity
    -0.126192,-0.013194, 0.093650, 0.101334, 0.199962, 0.212259, 0.244620, 0.290901, 0.277144, 0.073571, 0.053290,-0.000785,-0.002314,-0.063185,-0.028796, 0.102022, 0.205345, 0.265245, 0.296889, 0.270984, 0.281316, 0.273267, 0.219439, 0.248133, 0.253937, 0.303837, 0.191803, 0.260417, 0.250001, 1.000000, 0.514668, 0.577662, 0.334307, 0.342258, 0.298841, 0.357369, 0.262562, 0.143020, 0.357464, 0.358042, 0.301557, 0.220719, 0.142073, 0.038445,-0.049971, 0.248120, 0.089398, 0.132243, 0.448769, 0.449407, 0.367768, 0.308395, 0.343805, 0.360684, 0.052479, 0.133770,
    // 30 EmergingMarketsEquity
    -0.064726,-0.085078, 0.206785, 0.214083, 0.452964, 0.507589, 0.672143, 0.694416, 0.638709, 0.122236, 0.331967, 0.013948,-0.116890,-0.070779,-0.206918, 0.252006, 0.581835, 0.629908, 0.627725, 0.734586, 0.717796, 0.617005, 0.677622, 0.706652, 0.707170, 0.711755, 0.668575, 0.581158, 0.590153, 0.514668, 1.000000, 0.965898, 0.773406, 0.766663, 0.713957, 0.754907, 0.579031, 0.283679, 0.491004, 0.482070, 0.598316, 0.653149,-0.001770, 0.305648,-0.213205, 0.169817, 0.392097, 0.012235, 0.710810, 0.539885, 0.690480, 0.729063, 0.793761, 0.763207, 0.208330, 0.080762,
    // 31 AcAsiaExJapanEquity
    -0.119292,-0.085229, 0.244154, 0.235786, 0.470532, 0.506261, 0.625517, 0.647900, 0.584880, 0.149155, 0.310700, 0.055823,-0.063194,-0.020761,-0.141032, 0.279225, 0.555493, 0.592672, 0.615748, 0.687390, 0.669057, 0.587123, 0.622299, 0.659024, 0.652495, 0.668798, 0.612446, 0.572886, 0.550952, 0.577662, 0.965898, 1.000000, 0.731165, 0.727002, 0.673036, 0.713038, 0.543436, 0.286251, 0.461967, 0.444258, 0.584401, 0.633292, 0.050963, 0.277107,-0.157738, 0.190477, 0.317904, 0.013232, 0.676426, 0.541365, 0.623756, 0.658091, 0.732307, 0.702278, 0.153106, 0.112412,
    // 32 AcWorldEquity
     0.033618,-0.154830, 0.167332, 0.289418, 0.408587, 0.557597, 0.690648, 0.732492, 0.657361, 0.205715, 0.417469, 0.050307, 0.059907,-0.066344,-0.036447, 0.267217, 0.489938, 0.564630, 0.482271, 0.906106, 0.860569, 0.958303, 0.872050, 0.852235, 0.810055, 0.863082, 0.741256, 0.777650, 0.715076, 0.334307, 0.773406, 0.731165, 1.000000, 0.997225, 0.995715, 0.794719, 0.584206, 0.391061, 0.494958, 0.482401, 0.580724, 0.840786, 0.137972, 0.382581,-0.040904, 0.299829, 0.376076,-0.089546, 0.760469, 0.610812, 0.700744, 0.777469, 0.796510, 0.708174, 0.143795, 0.264111,
    // 33 AcWorldExEmuEquity
     0.033696,-0.157510, 0.157214, 0.286717, 0.395614, 0.548613, 0.674789, 0.718019, 0.654171, 0.204148, 0.405096, 0.047738, 0.093581,-0.070868, 0.002006, 0.258207, 0.468821, 0.570633, 0.464820, 0.877782, 0.837295, 0.966604, 0.853628, 0.813789, 0.775895, 0.849731, 0.710772, 0.781932, 0.698504, 0.342258, 0.766663, 0.727002, 0.997225, 1.000000, 0.993609, 0.775763, 0.572827, 0.413848, 0.505220, 0.493621, 0.589443, 0.837705, 0.181989, 0.403673,-0.012002, 0.323551, 0.390874,-0.067556, 0.764621, 0.622074, 0.688288, 0.760031, 0.777037, 0.695858, 0.134878, 0.305875,
    // 34 DevelopedWorldEquity
     0.046021,-0.162246, 0.155366, 0.287026, 0.388597, 0.543113, 0.670015, 0.710165, 0.637758, 0.207780, 0.413864, 0.051899, 0.079815,-0.064405,-0.013889, 0.258814, 0.462315, 0.535229, 0.448313, 0.898356, 0.850331, 0.972588, 0.868997, 0.843179, 0.795882, 0.854103, 0.725802, 0.777282, 0.707058, 0.298841, 0.713957, 0.673036, 0.995715, 0.993609, 1.000000, 0.772385, 0.564983, 0.397045, 0.482432, 0.469251, 0.561160, 0.837989, 0.156247, 0.383621,-0.014032, 0.310603, 0.360121,-0.099697, 0.746770, 0.605141, 0.677358, 0.756497, 0.767908, 0.676224, 0.126687, 0.284345,
    // 35 GlobalConvertibleBondsHedged
    -0.146586,-0.044687, 0.343122, 0.352495, 0.616340, 0.649956, 0.805459, 0.756638, 0.676289, 0.252829, 0.460839, 0.137636,-0.178663, 0.043653,-0.316197, 0.401515, 0.697945, 0.421674, 0.692184, 0.780727, 0.827430, 0.674496, 0.850049, 0.785800, 0.814185, 0.667053, 0.695176, 0.578911, 0.649726, 0.357369, 0.754907, 0.713038, 0.794719, 0.775763, 0.772385, 1.000000, 0.663083, 0.101991, 0.371295, 0.354895, 0.430255, 0.672886,-0.213773, 0.118073,-0.436434,-0.065260, 0.234836,-0.099787, 0.630355, 0.576496, 0.805925, 0.864836, 0.923617, 0.802749, 0.212803,-0.130884,
    // 36 GlobalCreditSensitiveConvertibleHedged
    -0.010468,-0.157521, 0.245402, 0.305871, 0.450507, 0.518436, 0.617555, 0.648058, 0.653272, 0.221192, 0.264211, 0.117442,-0.019492, 0.033085,-0.135760, 0.300571, 0.547590, 0.327434, 0.651357, 0.589405, 0.626559, 0.503027, 0.604366, 0.563757, 0.595316, 0.551831, 0.445482, 0.418911, 0.409675, 0.262562, 0.579031, 0.543436, 0.584206, 0.572827, 0.564983, 0.663083, 1.000000, 0.365635, 0.433363, 0.393001, 0.519491, 0.504435,-0.059887, 0.271587,-0.188907,-0.058324, 0.220658,-0.075893, 0.476203, 0.384756, 0.584236, 0.691745, 0.651611, 0.659034, 0.032948,-0.009190,
    // 37 UsCoreRealEstate
     0.127869,-0.312617,-0.161329,-0.121649,-0.085214, 0.012245, 0.218073, 0.240035, 0.345247,-0.143188,-0.017326,-0.175605, 0.092836,-0.191739, 0.122946,-0.148711,-0.008894, 0.236169, 0.118328, 0.276154, 0.245772, 0.439906, 0.228343, 0.174299, 0.175066, 0.371024, 0.133774, 0.340248, 0.280746, 0.143020, 0.283679, 0.286251, 0.391061, 0.413848, 0.397045, 0.101991, 0.365635, 1.000000, 0.723169, 0.699488, 0.642455, 0.472537, 0.474829, 0.488103, 0.425725, 0.278499, 0.413382, 0.092838, 0.409258, 0.295591, 0.225164, 0.217260, 0.134173, 0.291566,-0.010590, 0.494089,
    // 38 EuropeanCoreRealEstate
     0.129929,-0.279618,-0.199698,-0.155595,-0.020789, 0.062521, 0.364920, 0.360602, 0.475436,-0.192618, 0.033725,-0.263257,-0.167453,-0.292334,-0.191850,-0.176540, 0.110656, 0.169803, 0.249755, 0.406322, 0.400782, 0.473039, 0.396302, 0.333313, 0.350040, 0.479134, 0.294202, 0.325971, 0.444913, 0.357464, 0.491004, 0.461967, 0.494958, 0.505220, 0.482432, 0.371295, 0.433363, 0.723169, 1.000000, 0.978486, 0.581669, 0.372451, 0.192519, 0.358689, 0.101107, 0.131793, 0.484883, 0.039991, 0.547860, 0.458441, 0.475622, 0.406706, 0.402662, 0.493590, 0.127085, 0.234819,
    // 39 EuropeanValueAddedRealEstate
     0.167767,-0.271088,-0.307885,-0.277191,-0.111850,-0.026237, 0.329028, 0.331387, 0.465666,-0.316078,-0.050519,-0.389474,-0.248777,-0.406488,-0.249006,-0.295941, 0.043416, 0.123927, 0.191667, 0.391524, 0.386391, 0.456372, 0.375368, 0.315199, 0.335765, 0.484894, 0.299645, 0.334139, 0.479400, 0.358042, 0.482070, 0.444258, 0.482401, 0.493621, 0.469251, 0.354895, 0.393001, 0.699488, 0.978486, 1.000000, 0.576039, 0.326538, 0.154437, 0.372978, 0.090853, 0.163393, 0.538926, -0.007591, 0.576459, 0.466423, 0.490603, 0.411075, 0.406787, 0.491540, 0.173530, 0.234463,
    // 40 AsiaPacificCoreRealEstate
     0.115529,-0.360756,-0.066991,-0.068813, 0.176916, 0.239874, 0.506440, 0.521051, 0.578668,-0.149280, 0.084673,-0.225356,-0.000461,-0.238612, 0.006060,-0.042332, 0.276794, 0.391623, 0.387448, 0.536221, 0.533978, 0.518688, 0.407562, 0.439323, 0.484940, 0.607283, 0.446760, 0.446109, 0.332212, 0.301557, 0.598316, 0.584401, 0.580724, 0.589443, 0.561160, 0.430255, 0.519491, 0.642455, 0.581669, 0.576039, 1.000000, 0.645550, 0.305227, 0.474887, 0.113081, 0.322685, 0.514581, 0.165993, 0.645158, 0.393979, 0.491674, 0.511937, 0.439879, 0.582910, 0.068950, 0.410996,
    // 41 GlobalReits
    -0.030155,-0.171152, 0.307363, 0.375810, 0.486759, 0.576880, 0.666147, 0.668408, 0.564343, 0.308896, 0.494374, 0.208395, 0.158702, 0.118395, 0.066854, 0.392539, 0.520800, 0.580761, 0.480115, 0.790169, 0.753090, 0.800888, 0.740456, 0.727147, 0.707305, 0.749808, 0.674037, 0.648196, 0.534683, 0.220719, 0.653149, 0.633292, 0.840786, 0.837705, 0.837989, 0.672886, 0.504435, 0.472537, 0.372451, 0.326538, 0.645550, 1.000000, 0.207246, 0.397404, 0.021895, 0.285674, 0.295527,-0.037711, 0.609887, 0.412270, 0.524429, 0.654689, 0.636479, 0.608356, 0.119173, 0.292508,
    // 42 CommercialMortgageLoans
    -0.030195,-0.058692, 0.015900, 0.075779,-0.081785,-0.056064,-0.091505,-0.079708, 0.016942, 0.103052,-0.054937, 0.114769, 0.614681, 0.091088, 0.657373, 0.048017,-0.131611, 0.334323,-0.094659,-0.063082,-0.120761, 0.267281,-0.207788,-0.157353,-0.208480, 0.035729,-0.204499, 0.197773,-0.113946, 0.142073,-0.001770, 0.050963, 0.137972, 0.181989, 0.156247,-0.213773,-0.059887, 0.474829, 0.192519, 0.154437, 0.305227, 0.207246, 1.000000, 0.498684, 0.679225, 0.596173, 0.120488, 0.411162, 0.246371, 0.263514,-0.145376,-0.192814,-0.271338,-0.086962,-0.147650, 0.897835,
    // 43 GlobalCoreInfrastructure
     0.220039,-0.168570,-0.159871,-0.095509,-0.014724, 0.071664, 0.300231, 0.339427, 0.465026,-0.126763, 0.070592,-0.219517, 0.105863,-0.258364, 0.114432,-0.112344, 0.139652, 0.356406, 0.196081, 0.277726, 0.245115, 0.407959, 0.175277, 0.206109, 0.164113, 0.384051, 0.104633, 0.373167, 0.268088, 0.038445, 0.305648, 0.277107, 0.382581, 0.403673, 0.383621, 0.118073, 0.271587, 0.488103, 0.358689, 0.372978, 0.474887, 0.397404, 0.498684, 1.000000, 0.342804, 0.431282, 0.361775, 0.141548, 0.510811, 0.385570, 0.198889, 0.208796, 0.159748, 0.307647,-0.048788, 0.504536,
    // 44 GlobalCoreTransport
     0.255928,-0.080004,-0.251935,-0.210165,-0.442683,-0.401215,-0.364672,-0.320623,-0.203890,-0.131417,-0.243728,-0.076237, 0.364984,-0.044129, 0.457325,-0.249700,-0.459009, 0.057254,-0.412296,-0.187172,-0.321818, 0.105225,-0.274681,-0.231019,-0.333948,-0.124072,-0.269310,-0.007717,-0.149967,-0.049971,-0.213205,-0.157738,-0.040904,-0.012002,-0.014032,-0.436434,-0.188907, 0.425725, 0.101107, 0.090853, 0.113081, 0.021895, 0.679225, 0.342804, 1.000000, 0.480653, 0.020167, 0.259923,-0.039352, 0.025060,-0.320163,-0.350619,-0.411346,-0.311100,-0.103139, 0.642675,
    // 45 GlobalTimberland
     0.188321, 0.001853,-0.175798,-0.104738,-0.147644,-0.080635,-0.034082,-0.004314, 0.057961,-0.102947,-0.017287,-0.134910, 0.303401,-0.152214, 0.352835,-0.131794,-0.110044, 0.327093,-0.094547, 0.155573, 0.062057, 0.368865, 0.007945, 0.085645, 0.022941, 0.239632, 0.116156, 0.291982, 0.094871, 0.248120, 0.169817, 0.190477, 0.299829, 0.323551, 0.310603,-0.065260,-0.058324, 0.278499, 0.131793, 0.163393, 0.322685, 0.285674, 0.596173, 0.431282, 0.480653, 1.000000, 0.280103, 0.225600, 0.453482, 0.367000, 0.092477, 0.041620,-0.020064, 0.078869, 0.169535, 0.697302,
    // 46 Commodities
     0.253783,-0.152517,-0.183371,-0.147569,-0.005153, 0.073549, 0.279881, 0.286437, 0.391829,-0.202381, 0.140057,-0.302779,-0.082212,-0.332124,-0.072423,-0.157258, 0.076887, 0.230516, 0.124565, 0.311806, 0.296740, 0.324041, 0.235738, 0.216661, 0.253367, 0.462035, 0.337288, 0.239349, 0.218251, 0.089398, 0.392097, 0.317904, 0.376076, 0.390874, 0.360121, 0.234836, 0.220658, 0.413382, 0.484883, 0.538926, 0.514581, 0.295527, 0.120488, 0.361775, 0.020167, 0.280103, 1.000000, 0.246717, 0.482152, 0.237939, 0.410968, 0.391198, 0.334565, 0.460165, 0.391943, 0.279408,
    // 47 Gold
    -0.008318, 0.103041, 0.206518, 0.129236, 0.134763, 0.073155,-0.057398,-0.089225,-0.083002, 0.134108, 0.091422, 0.205689, 0.334615, 0.228731, 0.337280, 0.189255, 0.049512, 0.224147, 0.070955,-0.156638,-0.140113,-0.083506,-0.187443,-0.205485,-0.173926,-0.074054,-0.145746,-0.091507,-0.300836, 0.132243, 0.012235, 0.013232,-0.089546,-0.067556,-0.099697,-0.099787,-0.075893, 0.092838, 0.039991,-0.007591, 0.165993,-0.037711, 0.411162, 0.141548, 0.259923, 0.225600, 0.246717, 1.000000,-0.006734,-0.029958,-0.025984,-0.120009,-0.096043,-0.036239, 0.204807, 0.247870,
    // 48 PrivateEquity
     0.043866,-0.202085,-0.135713,-0.062514, 0.181464, 0.298043, 0.567413, 0.565564, 0.630983,-0.159048, 0.140084,-0.300164,-0.143456,-0.371177,-0.171810,-0.067720, 0.369772, 0.463580, 0.439594, 0.682771, 0.682208, 0.720615, 0.606706, 0.619749, 0.617028, 0.705614, 0.564530, 0.514984, 0.523572, 0.448769, 0.710810, 0.676426, 0.760469, 0.764621, 0.746770, 0.630355, 0.476203, 0.409258, 0.547860, 0.576459, 0.645158, 0.609887, 0.246371, 0.510811,-0.039352, 0.453482, 0.482152,-0.006734, 1.000000, 0.756589, 0.686757, 0.693308, 0.657950, 0.692411, 0.194952, 0.399371,
    // 49 VentureCapital
    -0.124020,-0.199375,-0.047808, 0.030002, 0.143889, 0.237305, 0.416308, 0.366041, 0.443763,-0.029697, 0.081226,-0.132673,-0.037657,-0.205489,-0.083687, 0.014265, 0.298450, 0.347878, 0.339360, 0.485153, 0.511585, 0.611979, 0.495551, 0.450169, 0.428976, 0.479580, 0.335649, 0.463010, 0.451174, 0.449407, 0.539885, 0.541365, 0.610812, 0.622074, 0.605141, 0.576496, 0.384756, 0.295591, 0.458441, 0.466423, 0.393979, 0.412270, 0.263514, 0.385570, 0.025060, 0.367000, 0.237939,-0.029958, 0.756589, 1.000000, 0.604721, 0.540861, 0.569374, 0.493966, 0.092464, 0.326307,
    // 50 DiversifiedHedgeFundsHedged
    -0.029928,-0.116586, 0.070330, 0.083033, 0.354718, 0.413382, 0.625901, 0.664306, 0.680065,-0.020117, 0.240521,-0.135702,-0.274263,-0.197293,-0.359668, 0.114461, 0.459867, 0.293984, 0.498030, 0.695827, 0.762729, 0.577032, 0.677890, 0.664298, 0.735862, 0.656845, 0.597141, 0.503792, 0.619393, 0.367768, 0.690480, 0.623756, 0.700744, 0.688288, 0.677358, 0.805925, 0.584236, 0.225164, 0.475622, 0.490603, 0.491674, 0.524429,-0.145376, 0.198889,-0.320163, 0.092477, 0.410968,-0.025984, 0.686757, 0.604721, 1.000000, 0.861275, 0.869933, 0.834211, 0.458763,-0.026620,
    // 51 EventDrivenHedgeFundsHedged
     0.025710,-0.102909, 0.162433, 0.170076, 0.426340, 0.507282, 0.779183, 0.779853, 0.764670, 0.064246, 0.332178,-0.060024,-0.271239,-0.136947,-0.372129, 0.215933, 0.574246, 0.380074, 0.584433, 0.787287, 0.852194, 0.659585, 0.801335, 0.767242, 0.837966, 0.734448, 0.703751, 0.556103, 0.658032, 0.308395, 0.729063, 0.658091, 0.777469, 0.760031, 0.756497, 0.864836, 0.691745, 0.217260, 0.406706, 0.411075, 0.511937, 0.654689,-0.192814, 0.208796,-0.350619, 0.041620, 0.391198,-0.120009, 0.693308, 0.540861, 0.861275, 1.000000, 0.934559, 0.901263, 0.260938,-0.032025,
    // 52 LongBiasHedgeFundsHedged
    -0.049969,-0.073098, 0.237963, 0.206599, 0.496615, 0.533324, 0.767874, 0.735343, 0.681369, 0.105472, 0.355077, 0.004260,-0.304016,-0.064794,-0.421577, 0.275314, 0.622819, 0.385807, 0.620651, 0.797946, 0.846584, 0.663558, 0.868692, 0.796812, 0.836839, 0.708323, 0.717230, 0.567081, 0.695369, 0.343805, 0.793761, 0.732307, 0.796510, 0.777037, 0.767908, 0.923617, 0.651611, 0.134173, 0.402662, 0.406787, 0.439879, 0.636479,-0.271338, 0.159748,-0.411346,-0.020064, 0.334565,-0.096043, 0.657950, 0.569374, 0.869933, 0.934559, 1.000000, 0.843676, 0.292478,-0.146061,
    // 53 RelativeValueHedgeFundsHedged
     0.037044,-0.046906, 0.158359, 0.148021, 0.440844, 0.513936, 0.818946, 0.837878, 0.866461, 0.030823, 0.312904,-0.093473,-0.246777,-0.175028,-0.331448, 0.206802, 0.592994, 0.457850, 0.646138, 0.724141, 0.770304, 0.567770, 0.668773, 0.689234, 0.756901, 0.711733, 0.651315, 0.538172, 0.616776, 0.360684, 0.763207, 0.702278, 0.708174, 0.695858, 0.676224, 0.802749, 0.659034, 0.291566, 0.493590, 0.491540, 0.582910, 0.608356,-0.086962, 0.307647,-0.311100, 0.078869, 0.460165,-0.036239, 0.692411, 0.493966, 0.834211, 0.901263, 0.843676, 1.000000, 0.256350, 0.035815,
    // 54 MacroHedgeFundsHedged
     0.046943, 0.097506,-0.107475,-0.067024, 0.009855, 0.016898, 0.063349, 0.086912, 0.069578,-0.091127, 0.130056,-0.123537,-0.110483,-0.130646,-0.135058,-0.070419, 0.032831, 0.038685, 0.011386, 0.160432, 0.169865, 0.063295, 0.121901, 0.142854, 0.211719, 0.185687, 0.266626, 0.028412, 0.102731, 0.052479, 0.208330, 0.153106, 0.143795, 0.134878, 0.126687, 0.212803, 0.032948,-0.010590, 0.127085, 0.173530, 0.068950, 0.119173,-0.147650,-0.048788,-0.103139, 0.169535, 0.391943, 0.204807, 0.194952, 0.092464, 0.458763, 0.260938, 0.292478, 0.256350, 1.000000,-0.099624,
    // 55 DirectLending
     0.102551,-0.130484,-0.179681,-0.063629,-0.192779,-0.105659,-0.039760,-0.017795, 0.101970,-0.049174,-0.088808,-0.106502, 0.462127,-0.147156, 0.522903,-0.133910,-0.195837, 0.329432,-0.132167, 0.064144,-0.001537, 0.385497,-0.102681,-0.043278,-0.082027, 0.191431,-0.052576, 0.303062, 0.034089, 0.133770, 0.080762, 0.112412, 0.264111, 0.305875, 0.284345,-0.130884,-0.009190, 0.494089, 0.234819, 0.234463, 0.410996, 0.292508, 0.897835, 0.504536, 0.642675, 0.697302, 0.279408, 0.247870, 0.399371, 0.326307,-0.026620,-0.032025,-0.146061, 0.035815,-0.099624, 1.000000,
];

// ─── Market singleton ─────────────────────────────────────────────────────────

pub struct Market;

pub static MARKET: Market = Market;

impl Market {
    /// Select a subset of assets for simulation.
    pub fn select(&self, assets: &[Asset]) -> AssetSelection {
        AssetSelection {
            assets: assets.to_vec(),
        }
    }

    /// Select all 56 assets.
    pub fn select_all(&self) -> AssetSelection {
        AssetSelection {
            assets: Asset::ALL.to_vec(),
        }
    }
}

// ─── Asset selection ──────────────────────────────────────────────────────────
#[derive(Debug, Clone)]
pub struct AssetSelection {
    assets: Vec<Asset>,
}

impl AssetSelection {
    pub fn len(&self) -> usize {
        self.assets.len()
    }

    pub fn is_empty(&self) -> bool {
        self.assets.is_empty()
    }

    /// μ values in decimal form, in selection order.
    pub fn mu_vec(&self) -> Vec<f64> {
        self.assets.iter().map(|a| a.mu()).collect()
    }

    /// σ values in decimal form, in selection order.
    pub fn sigma_vec(&self) -> Vec<f64> {
        self.assets.iter().map(|a| a.sigma()).collect()
    }

    /// μ as an nalgebra column vector.
    pub fn mu_dvector(&self) -> DVector<f64> {
        DVector::from_vec(self.mu_vec())
    }

    /// σ as an nalgebra column vector.
    pub fn sigma_dvector(&self) -> DVector<f64> {
        DVector::from_vec(self.sigma_vec())
    }

    /// Sub-correlation matrix for the selected assets.
    pub fn correlation_matrix(&self) -> DMatrix<f64> {
        let n = self.assets.len();
        DMatrix::from_fn(n, n, |i, j| self.assets[i].corr(self.assets[j]))
    }

    /// Covariance matrix Σ = diag(σ) · C · diag(σ).
    pub fn covariance_matrix(&self) -> DMatrix<f64> {
        let sigmas = self.sigma_vec();
        let n = sigmas.len();
        DMatrix::from_fn(n, n, |i, j| {
            sigmas[i] * sigmas[j] * self.assets[i].corr(self.assets[j])
        })
    }

    /// Covariance matrix with a small diagonal jitter for numerical stability.
    ///
    /// Use `eps = 1e-8` as a starting point.  This ensures [`DMatrix::cholesky`]
    /// succeeds even when near-duplicate assets make the matrix nearly singular.
    pub fn covariance_matrix_jittered(&self, eps: f64) -> DMatrix<f64> {
        let mut cov = self.covariance_matrix();
        for i in 0..cov.nrows() {
            cov[(i, i)] += eps;
        }
        cov
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // Verifies that every diagonal entry of CORR matches the asset at that index.
    // If a row is misaligned, this tells you exactly which asset broke.
    #[test]
    fn diagonal_is_one_for_all_assets() {
        for asset in Asset::ALL {
            assert_eq!(
                asset.corr(asset),
                1.0,
                "{:?} (index {}) has a diagonal != 1.0",
                asset,
                asset as usize,
            );
        }
    }

    #[test]
    fn matrix_is_symmetric() {
        for a in Asset::ALL {
            for b in Asset::ALL {
                assert!(
                    (a.corr(b) - b.corr(a)).abs() < 1e-12,
                    "asymmetry between {:?} and {:?}",
                    a,
                    b,
                );
            }
        }
    }

    #[test]
    fn params_length_matches_asset_count() {
        assert_eq!(PARAMS.len(), Asset::COUNT);
    }

    #[test]
    fn corr_length_matches_asset_count() {
        assert_eq!(CORR.len(), Asset::COUNT * Asset::COUNT);
    }

    #[test]
    fn selection_correlation_matrix_shape() {
        let sel = MARKET.select(&[Asset::EuroCash, Asset::EuropeanLargeCap, Asset::Gold]);
        let c = sel.correlation_matrix();
        assert_eq!(c.nrows(), 3);
        assert_eq!(c.ncols(), 3);
        for i in 0..3 {
            assert_eq!(c[(i, i)], 1.0);
        }
    }

    #[test]
    fn cholesky_succeeds_with_jitter() {
        // AC World + AC World ex-EMU + Developed World are nearly collinear (ρ > 0.99)
        // — a stress test for the jitter path.
        let sel = MARKET.select(&[
            Asset::AcWorldEquity,
            Asset::AcWorldExEmuEquity,
            Asset::DevelopedWorldEquity,
        ]);
        let cov = sel.covariance_matrix_jittered(1e-8);
        assert!(
            cov.clone().cholesky().is_some(),
            "Cholesky failed even with jitter"
        );
    }

    #[test]
    fn mu_sigma_decimal_conversion() {
        // EuropeanLargeCap: arithmetic 7.426945 %, vol 14.961542 %
        assert!((Asset::EuropeanLargeCap.mu() - 0.07426945).abs() < 1e-7);
        assert!((Asset::EuropeanLargeCap.sigma() - 0.14961542).abs() < 1e-7);
    }
}
