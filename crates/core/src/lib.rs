mod structs;
mod utils;
mod v1;
mod v2;

use serde_json::json;
use wasm_bindgen::prelude::*;

use crate::v2::assumptions::Asset;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn run_percentile_monte_carlo_v1(
    allocation: &[f64],
    portfolio: f64,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    return v1::run_percentile_monte_carlo(allocation, portfolio, seed, on_update);
}

#[wasm_bindgen]
pub fn greet(s: &str) {
    let message = format!("Hello, {s} from core!");
    alert(&message);
}

#[wasm_bindgen]
pub fn step_averaged_monte_carlo_v1(
    allocation: &[f64],
    portfolio: f64,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    return v1::step_averaged_monte_carlo(allocation, portfolio, seed, on_update);
}

/// Runs the simulation step-by-step, but instead of averaging per-asset prices it divides runs
/// into `n_groups` buckets and reports the average portfolio value of each bucket at every step.
/// `on_update(step: u32, group_values: Float64Array)` where `group_values.length === n_groups`.
#[wasm_bindgen]
pub fn run_grouped_monte_carlo_v1(
    allocation: &[f64],
    portfolio: f64,
    n_groups: usize,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    return v1::run_grouped_monte_carlo(allocation, portfolio, n_groups, seed, on_update);
}

/// Runs the simulation once and at each step emits all three views in a single callback:
///   `on_update(step, { avg: Float64Array[6], groups: Float64Array[n_groups], pcts: Float64Array[3] })`
/// `pcts` = [p10, p50, p90] of the portfolio value distribution across all runs.
#[wasm_bindgen]
pub fn run_combined_monte_carlo_v1(
    allocation: &[f64],
    portfolio: f64,
    n_groups: usize,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    return v1::run_combined_monte_carlo(allocation, portfolio, n_groups, seed, on_update);
}

// EuroInflation is always index 0 in the LTCMA universe; used as the inflation
// reference asset when include_inflation is true.
const INFLATION_ASSET: &Asset = &Asset::EuroInflation;

/// Returns a JSON array of all investable LTCMA assets (EuroInflation excluded):
/// `[{index, label, mu, sigma}, ...]`
#[wasm_bindgen]
pub fn get_available_assets() -> String {
    let mut map = serde_json::Map::new();
    Asset::ALL
        .iter()
        .enumerate()
        .filter(|(_, asset)| *asset != INFLATION_ASSET)
        .for_each(|(_, &asset)| {
            map.insert(
                String::from(asset.label()),
                json!({
                    "index": asset as usize,
                    "label": asset.label(),
                    "mu": asset.mu(),
                    "sigma": asset.sigma(),
                }),
            );
            ()
        });
    serde_json::Value::Object(map).to_string()
}

/// Runs the v2 combined simulation with a user-supplied asset selection and time unit.
///
/// `asset_indices` – indices into the 56-asset LTCMA universe (see `get_available_assets`).
/// `allocation`    – portfolio weights; must sum to 1.0 and have the same length as `asset_indices`.
/// `time_unit`     – Days (dt = 1/250), Months (dt = 1/12), Years (dt = 1).
/// `n_steps`       – number of simulation steps in the chosen unit.
/// `on_update`     – called each step with `(step: u32, { avg: Float64Array, groups: Float64Array, pcts: Float64Array })`.
#[wasm_bindgen]
pub fn run_combined_monte_carlo_v2(
    asset_indices: &[u32],
    allocation: &[f64],
    portfolio: f64,
    n_groups: usize,
    n_steps: usize,
    time_unit: v2::structs::TimeUnit,
    include_inflation: bool,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> Result<f64, JsValue> {
    use v2::assumptions::Asset;
    use v2::structs::SimConfig;

    if asset_indices.is_empty() {
        return Err(JsValue::from_str("asset_indices must not be empty"));
    }
    if allocation.len() != asset_indices.len() {
        return Err(JsValue::from_str(
            "allocation length must match asset_indices length",
        ));
    }
    let alloc_sum: f64 = allocation.iter().sum();
    if (alloc_sum - 1.0).abs() > 0.01 {
        return Err(JsValue::from_str("allocation must sum to 1.0"));
    }
    if allocation.iter().any(|&w| w < 0.0) {
        return Err(JsValue::from_str("allocation weights must be non-negative"));
    }
    for &idx in asset_indices {
        if idx as usize >= Asset::COUNT {
            return Err(JsValue::from_str("asset index out of range"));
        }
    }

    use nalgebra::DVector;

    let mut assets: Vec<Asset> = asset_indices
        .iter()
        .map(|&i| Asset::ALL[i as usize])
        .collect();

    // The inflation asset is appended to both the selection and the allocation
    // (with weight 0.0 so it contributes nothing to portfolio value). Its
    // position in the selection array is recorded as inflation_idx so
    // run_combined can initialise its price to 1.0 and track it separately.
    let mut alloc_vec: Vec<f64> = allocation.to_vec();
    let inflation_idx = if include_inflation {
        let idx = assets.len();
        assets.push(*INFLATION_ASSET);
        alloc_vec.push(0.0);
        Some(idx)
    } else {
        None
    };

    let config = SimConfig {
        dt: time_unit.default_dt(),
        n_steps,
        n_runs: 1_000,
        investment: portfolio,
        allocation: DVector::from_vec(alloc_vec),
        selection: v2::assumptions::MARKET.select(&assets),
        inflation_idx,
    };

    Ok(v2::run_combined(&config, n_groups, seed, on_update))
}
