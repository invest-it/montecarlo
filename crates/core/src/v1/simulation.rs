use std::ops::Range;

use rand::prelude::*;
use rand_distr::StandardNormal;

use crate::{
    structs::{SimResults, StepUpdate},
    v1::structs::Vec6,
};

use super::structs::{SimConfigWithAssumptions, N_ASSETS};

//
pub fn portfolio_value(prices: &Vec6) -> f64 {
    (0..N_ASSETS).map(|i| prices[i]).sum()
}

// TODO: SeedableRng for multiplayer?

pub fn run_simulation_range<R: Rng>(
    config: &SimConfigWithAssumptions,
    range: Range<usize>,
    rng: &mut R,
    prices: &mut Vec6,
    run: usize,
    tx: Option<&std::sync::mpsc::SyncSender<StepUpdate>>,
) {
    for step in range {
        let z_raw = Vec6::from_fn(|_, _| rng.sample(StandardNormal));
        let z_corr: Vec6 = config.cholesky * z_raw;

        for i in 0..N_ASSETS {
            let dt = config.dt;
            let mu = config.assets[i].mu;
            let sigma = config.assets[i].sigma;

            let drift = (mu - 0.5 * sigma.powi(2)) * dt;
            let diffusion = sigma * dt.sqrt() * z_corr[i];
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
    config: &SimConfigWithAssumptions,
    rng: &mut R,
    run: usize,
    tx: Option<&std::sync::mpsc::SyncSender<StepUpdate>>,
) -> f64 {
    let mut prices = config.portfolio;

    run_simulation_range(config, 0..config.n_steps, rng, &mut prices, run, tx);

    return portfolio_value(&prices);
}

pub fn run_all_seeded(config: &SimConfigWithAssumptions, seed: u64) -> SimResults {
    let mut rng = StdRng::seed_from_u64(seed);
    let results: SimResults = (0..config.n_runs)
        .map(|_| run_simulation(config, &mut rng, 0, None))
        .collect();

    return results;
}
