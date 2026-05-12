use std::ops::Range;

use nalgebra::DVector;
use rand::prelude::*;
use rand_distr::StandardNormal;

use super::structs::{SimAssumptions, SimConfig};
use crate::structs::{SimResults, StepUpdate};

//
pub fn portfolio_value(prices: &DVector<f64>) -> f64 {
    prices.sum()
}

// TODO: SeedableRng for multiplayer?

pub fn run_simulation_range<R: Rng>(
    config: &SimConfig,
    assumptions: &SimAssumptions,

    rng: &mut R,

    range: Range<usize>,
    prices: &mut DVector<f64>,

    run: usize,
    tx: Option<&std::sync::mpsc::SyncSender<StepUpdate>>,
) {
    let n_assets = config.selection.len();
    for step in range {
        let z_raw = DVector::<f64>::from_fn(n_assets, |_, _| rng.sample(StandardNormal));
        let z_corr: DVector<f64> = &assumptions.cholesky * z_raw;

        for i in 0..n_assets {
            let dt = config.dt;
            let mu = assumptions.mu[i];
            let sigma = assumptions.sigma[i];

            let drift = (mu - 0.5 * sigma.powi(2)) * dt;

            // sigma is dropped here because z_corr[i] already scales to sigma
            let diffusion = dt.sqrt() * z_corr[i];

            prices[i] *= (drift + diffusion).exp();
        }

        if let Some(tx) = tx {
            tx.send(StepUpdate {
                run,
                step,
                prices: prices.as_slice().to_vec(),
            })
            .ok();
        }
    }
}

pub fn run_simulation<R: Rng>(
    config: &SimConfig,
    rng: &mut R,
    run: usize,
    tx: Option<&std::sync::mpsc::SyncSender<StepUpdate>>,
) -> f64 {
    let mut prices = config.prices.clone();
    let assumptions = SimAssumptions::from(config.selection.clone());

    run_simulation_range(
        &config,
        &assumptions,
        rng,
        0..config.n_steps,
        &mut prices,
        run,
        tx,
    );

    return portfolio_value(&prices);
}

pub fn run_all_seeded(config: &SimConfig, seed: u64) -> SimResults {
    let mut rng = StdRng::seed_from_u64(seed);
    let results: SimResults = (0..config.n_runs)
        .map(|_| run_simulation(config, &mut rng, 0, None))
        .collect();

    return results;
}
