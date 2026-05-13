pub mod assumptions;
pub mod simulation;
pub mod structs;

use nalgebra::DVector;
use rand::{rngs::StdRng, SeedableRng};
use wasm_bindgen::prelude::*;

use self::simulation::{evaluate_portfolio, run_simulation_range};
use self::structs::{SimAssumptions, SimConfig, StepData};

pub fn run_combined(
    config: &SimConfig,
    n_groups: usize,
    seed: Option<u32>,
    on_update: &js_sys::Function,
) -> f64 {
    let assumptions = SimAssumptions::from(config.selection.clone());
    let mut rng: StdRng = seed
        .map(|s| StdRng::seed_from_u64(s as u64))
        .unwrap_or_else(|| rand::make_rng());

    let mut price_map: Vec<DVector<f64>> = vec![config.portfolio(); config.n_runs];

    // Inflation asset starts at 1.0 (index tracks a price ratio, not a dollar value)
    if let Some(inf_idx) = config.inflation_idx {
        for prices in &mut price_map {
            prices[inf_idx] = 1.0;
        }
    }

    let runs_per_group = (config.n_runs + n_groups - 1) / n_groups;
    let n_assets = config.selection.len();

    // Portfolio value excluding the inflation asset
    let portfolio_value = |prices: &DVector<f64>| -> f64 {
        match config.inflation_idx {
            Some(inf_idx) => prices
                .iter()
                .enumerate()
                .filter(|(i, _)| *i != inf_idx)
                .map(|(_, v)| v)
                .sum(),
            None => evaluate_portfolio(prices),
        }
    };

    let mut avg = vec![0.0; n_assets];
    let mut portfolio_values = vec![0.0; config.n_runs];
    let mut inflation_values = vec![1.0; config.n_runs];

    for step in 0..config.n_steps {
        for run in 0..config.n_runs {
            run_simulation_range(
                config,
                &assumptions,
                &mut rng,
                step..step + 1,
                &mut price_map[run],
                run,
                None,
            );
        }

        // Per-asset averages across all runs
        avg.fill(0.0);
        for prices in &price_map {
            for i in 0..n_assets {
                avg[i] += prices[i];
            }
        }
        let n_runs_f = config.n_runs as f64;
        avg.iter_mut().for_each(|v| *v /= n_runs_f);

        // Portfolio value and inflation value per run
        /*
         * let portfolio_values: Vec<f64> = price_map.iter().map(|p| portfolio_value(p)).collect();
         * let inflation_values: Vec<f64> = match config.inflation_idx {
         *     Some(inf_idx) => price_map.iter().map(|p| p[inf_idx]).collect(),
         *     None => vec![1.0; config.n_runs],
         * };
         */

        for (i, p) in price_map.iter().enumerate() {
            portfolio_values[i] = portfolio_value(p);
            if let Some(inf_idx) = config.inflation_idx {
                inflation_values[i] = p[inf_idx];
            }
        }

        // Group averages
        let groups: Vec<f64> = portfolio_values
            .chunks(runs_per_group)
            .map(|chunk| chunk.iter().sum::<f64>() / chunk.len() as f64)
            .collect();

        let groups_inflation: Vec<f64> = inflation_values
            .chunks(runs_per_group)
            .map(|chunk| chunk.iter().sum::<f64>() / chunk.len() as f64)
            .collect();

        let avg_inflation = inflation_values.iter().sum::<f64>() / config.n_runs as f64;

        // Percentiles: sort by nominal value, carry matching inflation value along
        let mut sorted_pairs: Vec<(f64, f64)> = portfolio_values
            .iter()
            .zip(inflation_values.iter())
            .map(|(&p, &inf)| (p, inf))
            .collect();
        sorted_pairs.sort_by(|a, b| a.0.total_cmp(&b.0));
        let n = sorted_pairs.len();
        let idx = |q: f64| ((q * n as f64) as usize).min(n - 1);
        let pcts = [
            sorted_pairs[idx(0.10)].0,
            sorted_pairs[idx(0.50)].0,
            sorted_pairs[idx(0.90)].0,
        ];
        let pcts_inflation = [
            sorted_pairs[idx(0.10)].1,
            sorted_pairs[idx(0.50)].1,
            sorted_pairs[idx(0.90)].1,
        ];

        let step_data = StepData {
            avg: avg.clone(),
            avg_inflation,
            groups,
            groups_inflation,
            pcts,
            pcts_inflation,
        };
        on_update
            .call2(
                &JsValue::NULL,
                &JsValue::from(step as u32),
                &step_data.to_js(),
            )
            .ok();
    }

    price_map.iter().map(|p| portfolio_value(p)).sum::<f64>() / price_map.len() as f64
}
