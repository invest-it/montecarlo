mod calc;
mod defaults;
mod structs;
mod utils;

use rand::{rngs::StdRng, SeedableRng};
use wasm_bindgen::prelude::*;

use crate::{
    calc::{portfolio_value, run_simulation_range},
    structs::{SimConfig, Vec6, Vec6Ext},
};

pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn run_percentile_monte_carlo(
    allocation: &[f64],
    portfolio: f64,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    let alloc = Vec6::from_column_slice(allocation);
    let config = SimConfig::new(alloc, portfolio);

    let mut rng: StdRng = seed
        .map(|s| StdRng::seed_from_u64(s as u64))
        .unwrap_or_else(|| rand::make_rng());
    let mut price_map: Vec<Vec6> = vec![config.prices; config.n_runs];

    for step in 0..config.n_steps {
        for run in 0..config.n_runs {
            let mut prices = price_map[run];
            run_simulation_range(&config, step..step + 1, &mut rng, &mut prices, run, None);
            price_map[run] = prices;
        }

        let mut values: Vec<f64> = price_map
            .iter()
            .map(|p| portfolio_value(&config, p))
            .collect();
        values.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let n = values.len();
        let p10 = values[((0.10 * n as f64) as usize).min(n - 1)];
        let p50 = values[((0.50 * n as f64) as usize).min(n - 1)];
        let p90 = values[((0.90 * n as f64) as usize).min(n - 1)];

        let percentiles = [p10, p50, p90];
        let js_values: JsValue = js_sys::Float64Array::from(percentiles.as_slice()).into();
        let _ = on_update.call2(&JsValue::NULL, &JsValue::from(step), &js_values);
    }

    price_map
        .iter()
        .map(|p| portfolio_value(&config, p))
        .sum::<f64>()
        / (price_map.len() as f64)
}

#[wasm_bindgen]
pub fn greet(s: &str) {
    let message = format!("Hello, {s} from core!");
    alert(&message);
}

#[wasm_bindgen]
pub fn step_averaged_monte_carlo(
    allocation: &[f64],
    portfolio: f64,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    let alloc = Vec6::from_column_slice(allocation);
    let config = SimConfig::new(alloc, portfolio);

    let mut rng: StdRng = seed
        .map(|s| StdRng::seed_from_u64(s as u64))
        .unwrap_or_else(|| rand::make_rng());
    let mut price_map: Vec<Vec6> = vec![config.prices; config.n_runs];

    for step in 0..config.n_steps {
        for run in 0..config.n_runs {
            let mut prices = price_map[run];
            run_simulation_range(&config, step..step + 1, &mut rng, &mut prices, run, None);
            price_map[run] = prices;
        }
        let average: Vec6 = price_map.iter().sum::<Vec6>() / (price_map.len() as f64);

        let val = average.into_js();
        let _ = on_update.call2(&JsValue::NULL, &JsValue::from(step), &val);
    }

    return price_map
        .iter()
        .map(|p| portfolio_value(&config, p))
        .sum::<f64>()
        / (price_map.len() as f64);
}

/// Runs the simulation step-by-step, but instead of averaging per-asset prices it divides runs
/// into `n_groups` buckets and reports the average portfolio value of each bucket at every step.
/// `on_update(step: u32, group_values: Float64Array)` where `group_values.length === n_groups`.
#[wasm_bindgen]
pub fn run_grouped_monte_carlo(
    allocation: &[f64],
    portfolio: f64,
    n_groups: usize,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    let alloc = Vec6::from_column_slice(allocation);
    let config = SimConfig::new(alloc, portfolio);

    let mut rng: StdRng = seed
        .map(|s| StdRng::seed_from_u64(s as u64))
        .unwrap_or_else(|| rand::make_rng());
    let mut price_map: Vec<Vec6> = vec![config.prices; config.n_runs];

    let runs_per_group = (config.n_runs + n_groups - 1) / n_groups;

    for step in 0..config.n_steps {
        for run in 0..config.n_runs {
            let mut prices = price_map[run];
            run_simulation_range(&config, step..step + 1, &mut rng, &mut prices, run, None);
            price_map[run] = prices;
        }

        let group_values: Vec<f64> = (0..n_groups)
            .map(|g| {
                let start = g * runs_per_group;
                let end = (start + runs_per_group).min(config.n_runs);
                let sum: f64 = price_map[start..end]
                    .iter()
                    .map(|p| portfolio_value(&config, p))
                    .sum();
                sum / (end - start) as f64
            })
            .collect();

        let js_values: JsValue = js_sys::Float64Array::from(group_values.as_slice()).into();
        let _ = on_update.call2(&JsValue::NULL, &JsValue::from(step), &js_values);
    }

    price_map
        .iter()
        .map(|p| portfolio_value(&config, p))
        .sum::<f64>()
        / (price_map.len() as f64)
}

/// Runs the simulation once and at each step emits all three views in a single callback:
///   `on_update(step, { avg: Float64Array[6], groups: Float64Array[n_groups], pcts: Float64Array[3] })`
/// `pcts` = [p10, p50, p90] of the portfolio value distribution across all runs.
#[wasm_bindgen]
pub fn run_combined_monte_carlo(
    allocation: &[f64],
    portfolio: f64,
    n_groups: usize,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    let alloc = Vec6::from_column_slice(allocation);
    let config = SimConfig::new(alloc, portfolio);

    let mut rng: StdRng = seed
        .map(|s| StdRng::seed_from_u64(s as u64))
        .unwrap_or_else(|| rand::make_rng());
    let mut price_map: Vec<Vec6> = vec![config.prices; config.n_runs];

    let runs_per_group = (config.n_runs + n_groups - 1) / n_groups;

    for step in 0..config.n_steps {
        for run in 0..config.n_runs {
            let mut prices = price_map[run];
            run_simulation_range(&config, step..step + 1, &mut rng, &mut prices, run, None);
            price_map[run] = prices;
        }

        // Per-asset average (6 values)
        let average: Vec6 = price_map.iter().sum::<Vec6>() / (price_map.len() as f64);
        let avg_js: JsValue = js_sys::Float64Array::from(average.as_slice()).into();

        // Compute all portfolio values once; reuse for groups and percentiles
        let port_values: Vec<f64> = price_map
            .iter()
            .map(|p| portfolio_value(&config, p))
            .collect();

        // Per-group averages (bucket by run index, preserving original order)
        let group_values: Vec<f64> = (0..n_groups)
            .map(|g| {
                let start = g * runs_per_group;
                let end = (start + runs_per_group).min(config.n_runs);
                port_values[start..end].iter().sum::<f64>() / (end - start) as f64
            })
            .collect();
        let grp_js: JsValue = js_sys::Float64Array::from(group_values.as_slice()).into();

        // Percentile bands
        let mut sorted = port_values.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let n = sorted.len();
        let pcts = [
            sorted[((0.10 * n as f64) as usize).min(n - 1)],
            sorted[((0.50 * n as f64) as usize).min(n - 1)],
            sorted[((0.90 * n as f64) as usize).min(n - 1)],
        ];
        let pct_js: JsValue = js_sys::Float64Array::from(pcts.as_slice()).into();

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &JsValue::from_str("avg"), &avg_js).ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("groups"), &grp_js).ok();
        js_sys::Reflect::set(&obj, &JsValue::from_str("pcts"), &pct_js).ok();
        let _ = on_update.call2(&JsValue::NULL, &JsValue::from(step), &obj.into());
    }

    price_map
        .iter()
        .map(|p| portfolio_value(&config, p))
        .sum::<f64>()
        / (price_map.len() as f64)
}
