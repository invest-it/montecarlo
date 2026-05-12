use std::iter::FromIterator;

#[derive(Debug, Clone)]
pub struct StepUpdate {
    pub run: usize,
    pub step: usize,
    pub prices: Vec<f64>,
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
