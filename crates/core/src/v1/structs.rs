use nalgebra::{SMatrix, SVector};
use wasm_bindgen::JsValue;

pub type Mat6 = SMatrix<f64, 6, 6>;
pub type Vec6 = SVector<f64, 6>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Asset {
    Fonds,
    Krypto,
    Immobilien,
    Anleihen,
    Tagesgeld,
    Rohstoffe,
}

pub const N_ASSETS: usize = 6;

#[derive(Debug, Clone)]
pub struct AssetParams {
    pub name: Asset,
    pub mu: f64,
    pub sigma: f64,
}

#[derive(Debug, Clone)]
pub struct SimConfigWithAssumptions {
    // --- market parameters (fixed) ---
    pub assets: [AssetParams; N_ASSETS],
    pub correlation: Mat6, // was CorrelationMatrix([f64; 36])
    pub cholesky: Mat6,    // was CholeskyFactor([f64; 36]) — derived at startup

    // --- simulation horizon (fixed) ---
    pub dt: f64,
    pub n_steps: usize,
    pub n_runs: usize, // TODO: limit

    // --- user inputs (variable) ---
    pub portfolio: f64,
    pub allocation: Vec6, // was Allocation([f64; 6]), weights must sum to 1.0
    pub prices: Vec6,     // starting price per asset, all 100.0 here
}

pub trait Vec6Ext {
    fn into_js(self) -> JsValue;
}

impl Vec6Ext for Vec6 {
    fn into_js(self) -> JsValue {
        // Your original logic
        let vec = Vec::from(self.as_slice());
        JsValue::from(vec)
    }
}
