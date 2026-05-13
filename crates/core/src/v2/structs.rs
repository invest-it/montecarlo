use super::assumptions::AssetSelection;
use nalgebra::{DMatrix, DVector};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TimeUnit {
    Days = 0,
    Months = 1,
    Years = 2,
}

impl TimeUnit {
    pub fn default_dt(self) -> f64 {
        match self {
            TimeUnit::Days => 1.0 / 250.0,
            TimeUnit::Months => 1.0 / 12.0,
            TimeUnit::Years => 1.0,
        }
    }
}

#[derive(Debug, Clone)]
pub struct SimConfig {
    // --- simulation horizon ---
    pub dt: f64,
    pub n_steps: usize,
    pub n_runs: usize, // TODO: limit

    // --- user inputs (variable) ---
    pub investment: f64,
    pub allocation: DVector<f64>, // weights must sum to 1.0

    pub selection: AssetSelection,

    // --- optional inflation tracking ---
    // Position of the inflation asset within `selection`. When set, that asset is
    // excluded from portfolio value and its path is used to populate the
    // *_inflation fields of StepData.
    pub inflation_idx: Option<usize>,
}

impl SimConfig {
    pub fn portfolio(&self) -> DVector<f64> {
        &self.allocation * self.investment
    }
}

pub struct SimAssumptions {
    pub cholesky: DMatrix<f64>,
    pub mu: DVector<f64>,
    pub sigma: DVector<f64>,
}

impl From<AssetSelection> for SimAssumptions {
    fn from(selection: AssetSelection) -> Self {
        let cov = selection.covariance_matrix_jittered(1e-8);
        let chol = cov.cholesky().expect("not positive definite");

        SimAssumptions {
            cholesky: chol.l(),
            mu: selection.mu_dvector(),
            sigma: selection.sigma_dvector(),
        }
    }
}

impl From<&AssetSelection> for SimAssumptions {
    fn from(selection: &AssetSelection) -> Self {
        let cov = selection.covariance_matrix_jittered(1e-8);
        let chol = cov.cholesky().expect("not positive definite");

        SimAssumptions {
            cholesky: chol.l(),
            mu: selection.mu_dvector(),
            sigma: selection.sigma_dvector(),
        }
    }
}

/// Per-step output emitted to the JS callback during a v2 simulation run.
pub struct StepData {
    pub avg: Vec<f64>,
    pub avg_inflation: f64,

    pub groups: Vec<f64>, // n groups of n <= N runs with x asset values summed up and divided by x
    pub groups_inflation: Vec<f64>, // average inflation for each group

    pub pcts: [f64; 3],
    pub pcts_inflation: [f64; 3],
}

impl StepData {
    pub fn to_js(&self) -> JsValue {
        let avg_js: JsValue = js_sys::Float64Array::from(self.avg.as_slice()).into();
        let grp_js: JsValue = js_sys::Float64Array::from(self.groups.as_slice()).into();
        let pct_js: JsValue = js_sys::Float64Array::from(self.pcts.as_slice()).into();

        let grp_inf_js: JsValue =
            js_sys::Float64Array::from(self.groups_inflation.as_slice()).into();
        let pct_inf_js: JsValue =
            js_sys::Float64Array::from(self.pcts_inflation.as_slice()).into();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &JsValue::from_str("avg"), &avg_js).ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("groups"), &grp_js).ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("pcts"), &pct_js).ok();
        js_sys::Reflect::set(
            &obj,
            &JsValue::from_str("avg_inflation"),
            &JsValue::from_f64(self.avg_inflation),
        )
        .ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("groups_inflation"), &grp_inf_js).ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("pcts_inflation"), &pct_inf_js).ok();
        obj.into()
    }
}
