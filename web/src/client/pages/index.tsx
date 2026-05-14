import { useRef, useState } from "react";
import { LineChart, PercentileChart } from "../sim/LineChart";
import { EndReturnsCard } from "../sim/EndReturnsCard";
import { useChartAnimation, type ChartDef } from "../sim/animation";
import {
    SimulationProvider,
    SimulationContext,
    useSelectedAssets,
} from "../sim/SimulationProvider";
import { useSimulation, type SimResults } from "../sim/simulation";
import { SimulationSettings } from "../sim/settings/SimulationSettings";
import { useContextStore } from "../common/hooks";
import { useWasm } from "../init-wasm";

function IndexSimulation() {
    const n_groups = 10;

    const [selectedChartIdx, setSelectedChartIdx] = useState<number | null>(
        null,
    );
    const modalRef = useRef<HTMLDialogElement>(null);

    const avg = useChartAnimation(6);
    const grp = useChartAnimation(n_groups);
    const pct = useChartAnimation(3); // p10, p50, p90
    const avg_inflation = useChartAnimation(1);
    const grp_inflation = useChartAnimation(n_groups);
    const pct_inflation = useChartAnimation(3);

    const selectedAssets = useSelectedAssets();
    const useYears = useContextStore(SimulationContext, (s) => s.useYears);

    function openChart(idx: number) {
        setSelectedChartIdx(idx);
        modalRef.current?.showModal();
    }

    const charts: ChartDef[] = [
        {
            title: "Portfolio Percentile Lines",
            description: "P10, P50 (median), and P90 across 1,000 runs",
            element: (
                <LineChart
                    labels={["P10", "P50", "P90"]}
                    series={pct.series}
                    renderKey={pct.renderKey}
                    showLegend
                    useYears={useYears}
                    colors={[
                        "var(--color-error)",
                        "var(--color-warning)",
                        "var(--color-success)",
                    ]}
                />
            ),
        },
        {
            title: "Portfolio Percentile Bands",
            description: "Shaded area = P10–P90 range · Line = median (P50)",
            element: (
                <PercentileChart
                    series={pct.series}
                    renderKey={pct.renderKey}
                    useYears={useYears}
                />
            ),
        },
        {
            title: "Portfolio Outcome Groups",
            description: `${n_groups} groups of runs averaged`,
            element: (
                <LineChart
                    labels={[]}
                    series={grp.series}
                    renderKey={grp.renderKey}
                    showLegend={false}
                    useYears={useYears}
                />
            ),
        },
        {
            title: "Average Asset Value per Step",
            description:
                "Mean across all runs per asset (smoothed by averaging — shows drift only)",
            element: (
                <LineChart
                    labels={selectedAssets.byLabel}
                    series={avg.series}
                    renderKey={avg.renderKey}
                    showLegend
                    useYears={useYears}
                />
            ),
        },
    ];

    const [simResults, setSimResults] = useState<SimResults | null>(null);

    const { runSimulation, isRunning, portfolio, includeInflation } =
        useSimulation(
            { avg, grp, pct, avg_inflation, grp_inflation, pct_inflation },
            n_groups,
        );

    const isWasmReady = useWasm();

    return (
        <>
            <div className="flex flex-col lg:flex-row-reverse lg:items-start gap-6 h-full">
                {/* Controls sidebar */}
                <div className="lg:w-96 lg:px-5 lg:shrink-0 mb-8 lg:h-full card bg-base-100 shadow-custom">
                    <div className="flex flex-col card-body">
                        <SimulationSettings />
                        <div className="flex items-center gap-4 mb-10">
                            <button
                                onClick={() =>
                                    runSimulation().then((res) => {
                                        console.log(res.endInflation);
                                        return setSimResults(res);
                                    })
                                }
                                disabled={!isWasmReady || isRunning}
                                className="btn btn-sm btn-primary"
                            >
                                {isRunning
                                    ? "Running..."
                                    : isWasmReady
                                      ? "Run Simulation"
                                      : "Loading WASM..."}
                            </button>
                            {simResults?.durationMs !== null && !isRunning && (
                                <span className="text-xs opacity-50">
                                    Took {simResults?.durationMs.toFixed(0)} ms
                                    to run
                                </span>
                            )}
                        </div>

                        {simResults?.endReturns && (
                            <EndReturnsCard
                                returns={simResults.endReturns}
                                portfolio={portfolio}
                                inflation={
                                    includeInflation
                                        ? simResults.endInflation
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-w-0">
                    {charts.map((chart, i) => (
                        <div
                            key={chart.title}
                            className="cursor-pointer group card bg-base-100 shadow-custom"
                            onClick={() => openChart(i)}
                            title="Click to expand"
                        >
                            <div className="card-body">
                                <h3 className="text-sm font-semibold mb-1 group-hover:underline">
                                    {chart.title}
                                </h3>
                                <p className="text-xs text-base-content/60 mb-2">
                                    {chart.description}
                                </p>
                                {chart.element}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fullscreen chart modal */}
            <dialog ref={modalRef} className="modal">
                <div className="modal-box w-11/12 max-w-5xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            ✕
                        </button>
                    </form>
                    {selectedChartIdx !== null && (
                        <>
                            <h3 className="font-bold text-lg mb-1">
                                {charts[selectedChartIdx]!.title}
                            </h3>
                            <p className="text-sm opacity-60 mb-4">
                                {charts[selectedChartIdx]!.description}
                            </p>
                            {charts[selectedChartIdx]!.element}
                        </>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}

export function index() {
    return (
        <SimulationProvider>
            <div className="mx-auto w-full max-w-7xl">
                <h2 className="text-4xl font-bold leading-snug mb-8">
                    Monte Carlo Portfolio Simulation
                </h2>

                <IndexSimulation />
            </div>
        </SimulationProvider>
    );
}
