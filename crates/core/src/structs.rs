use std::iter::FromIterator;

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
pub struct SimConfig {
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

#[derive(Debug, Clone)]
pub struct StepUpdate {
    pub run: usize,
    pub step: usize,
    pub prices: Vec6,
}

#[derive(Debug, Clone)]
pub struct SimResults {
    pub final_values: Vec<f64>, // sorted ascending
    pub mean: f64,
    pub var_10pct: f64,
}

impl SimResults {
    pub fn new(mut final_values: Vec<f64>) -> Self {
        let mean = final_values.iter().sum::<f64>() / final_values.len() as f64;
        final_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let var_idx = (0.10 * final_values.len() as f64) as usize;
        let var_10pct = final_values[var_idx];
        SimResults {
            final_values,
            mean,
            var_10pct,
        }
    }
}

impl FromIterator<f64> for SimResults {
    fn from_iter<I: IntoIterator<Item = f64>>(iter: I) -> Self {
        SimResults::new(iter.into_iter().collect())
    }
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
