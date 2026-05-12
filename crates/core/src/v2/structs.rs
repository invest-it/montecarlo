use super::assumptions::AssetSelection;
use nalgebra::{DMatrix, DVector};

#[derive(Debug, Clone)]
pub struct SimConfig {
    // --- simulation horizon ---
    pub dt: f64,
    pub n_steps: usize,
    pub n_runs: usize, // TODO: limit

    // --- user inputs (variable) ---
    pub investment: f64,
    pub allocation: DVector<f64>, // weights must sum to 1.0
    pub prices: DVector<f64>,     // starting price per asset, all 100.0 here

    pub selection: AssetSelection,
}

pub struct SimAssumptions {
    pub cholesky: DMatrix<f64>,
    pub mu: DVector<f64>,
    pub sigma: DVector<f64>,
}

impl From<AssetSelection> for SimAssumptions {
    fn from(selection: AssetSelection) -> Self {
        let cov = selection.covariance_matrix();
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
        let cov = selection.covariance_matrix();
        let chol = cov.cholesky().expect("not positive definite");

        SimAssumptions {
            cholesky: chol.l(),
            mu: selection.mu_dvector(),
            sigma: selection.sigma_dvector(),
        }
    }
}
