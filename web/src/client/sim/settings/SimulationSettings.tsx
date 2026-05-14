import { useContextStore } from "@/client/common/hooks";
import { PortfolioSettings } from "./PortfolioSettings";
import { SimulationContext } from "../SimulationProvider";
import { AssetSettings } from "./assets/AssetSettings";
import { SeedSettings } from "./SeedSettings";
import { StepSettings } from "./StepSettings";
import { InflationSettings } from "./InflationSettings";

export function SimulationSettings() {
    const {
        portfolio,
        setPortfolio,
        isRunning,
        seed,
        setSeed,
        includeInflation,
        setIncludeInflation,
        inflationConfig,
        setInflationConfig,
    } = useContextStore(SimulationContext, (s) => {
        return {
            portfolio: s.portfolio,
            setPortfolio: s.setPortfolio,
            isRunning: s.isRunning,
            seed: s.seed,
            setSeed: s.setSeed,
            stepCount: s.stepCount,
            setStepCount: s.setStepCount,
            includeInflation: s.includeInflation,
            setIncludeInflation: s.setIncludeInflation,
            inflationConfig: s.inflationConfig,
            setInflationConfig: s.setInflationConfig,
        };
    });
    return (
        <div className="flex flex-col items-stretch gap-4 mb-10">
            <PortfolioSettings
                portfolio={portfolio}
                setPortfolio={setPortfolio}
                isDisabled={isRunning}
            />
            <AssetSettings />

            <div>
                <span className="text-md font-medium my-4 block">
                    Inflation
                </span>

                <InflationSettings
                    includeInflation={includeInflation}
                    onIncludeInflationChange={setIncludeInflation}
                    config={inflationConfig}
                    onConfigChange={setInflationConfig}
                    isDisabled={isRunning}
                />
            </div>

            <span className="text-md font-medium my-4 block">Misc</span>

            <SeedSettings
                seed={seed}
                setSeed={setSeed}
                isDisabled={isRunning}
            />
            <StepSettings />
        </div>
    );
}
