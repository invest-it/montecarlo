mod structs;
mod utils;
mod v1;
mod v2;

use wasm_bindgen::prelude::*;

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
