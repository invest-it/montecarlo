use nalgebra::Cholesky;

use crate::v1::structs::{Asset, AssetParams, Mat6, SimConfigWithAssumptions, Vec6};

impl SimConfigWithAssumptions {
    pub fn new(allocation: Vec6, portfolio: f64) -> Self {
        let assets = [
            AssetParams {
                name: Asset::Fonds,
                mu: 0.10,
                sigma: 0.15,
            },
            AssetParams {
                name: Asset::Krypto,
                mu: 0.16,
                sigma: 0.90,
            },
            AssetParams {
                name: Asset::Immobilien,
                mu: 0.07,
                sigma: 0.12,
            },
            AssetParams {
                name: Asset::Anleihen,
                mu: 0.04,
                sigma: 0.06,
            },
            AssetParams {
                name: Asset::Tagesgeld,
                mu: 0.01,
                sigma: 0.00,
            },
            AssetParams {
                name: Asset::Rohstoffe,
                mu: 0.02,
                sigma: 0.16,
            },
        ];

        let correlation = Mat6::from_row_slice(&[
            1.00, 0.10, 0.20, 0.12, 0.00, 0.32, 0.10, 1.00, 0.08, 0.12, 0.00, 0.06, 0.20, 0.08,
            1.00, -0.17, 0.00, 0.23, 0.12, 0.12, -0.17, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
            1.00, 0.00, 0.32, 0.06, 0.23, 0.00, 0.00, 1.00,
        ]);

        let cholesky = Cholesky::new(correlation)
            .expect("correlation matrix must be positive-definite")
            .l();

        // Derive prices vector directly from asset definitions
        let prices = Vec6::from_fn(|i, _| allocation[i] * portfolio);

        SimConfigWithAssumptions {
            assets,
            correlation,
            cholesky,
            dt: 1.0 / 250.0,
            n_steps: 2_000,
            n_runs: 1_000,
            portfolio,
            allocation,
            prices,
        }
    }
}

impl Default for SimConfigWithAssumptions {
    fn default() -> Self {
        let mut alloc = Vec6::zeros();
        alloc[0] = 1.0; // 100% Fonds, matching the spreadsheet default
        Self::new(alloc, 10_000.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*; // brings everything from the parent module into scope

    #[test]
    fn test_allocation_sums_to_one() {
        let config = SimConfigWithAssumptions::default();
        let sum: f64 = config.allocation.iter().sum();
        assert!((sum - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_cholesky_reconstructs_correlation() {
        let config = SimConfigWithAssumptions::default();
        let l = config.cholesky;
        let reconstructed = l * l.transpose();
        let diff = reconstructed - config.correlation;
        // every element should be near zero
        assert!(diff.abs().max() < 1e-10);
    }
}
