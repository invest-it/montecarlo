import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
            title: t("simulation.charts.percentileLines.title"),
            description: t("simulation.charts.percentileLines.description"),
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
            title: t("simulation.charts.percentileBands.title"),
            description: t("simulation.charts.percentileBands.description"),
            element: (
                <PercentileChart
                    series={pct.series}
                    renderKey={pct.renderKey}
                    useYears={useYears}
                />
            ),
        },
        {
            title: t("simulation.charts.outcomeGroups.title"),
            description: t("simulation.charts.outcomeGroups.description", {
                count: n_groups,
            }),
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
            title: t("simulation.charts.averageAssetValue.title"),
            description: t("simulation.charts.averageAssetValue.description"),
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
                                    ? t("simulation.running")
                                    : isWasmReady
                                      ? t("simulation.run")
                                      : t("simulation.loadingWasm")}
                            </button>
                            {simResults?.durationMs != null && !isRunning && (
                                <span className="text-xs opacity-50">
                                    {t("simulation.duration", {
                                        ms: simResults?.durationMs.toFixed(0),
                                    })}
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
                <div
                    className={`grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-w-0 ${!simResults && !isRunning ? "opacity-70" : ""}`}
                >
                    {charts.map((chart, i) => (
                        <div
                            key={chart.title}
                            className={`group card bg-base-100 shadow-custom ${simResults ? "cursor-pointer" : ""}`}
                            onClick={() => {
                                if (!simResults) return;
                                openChart(i);
                            }}
                            title={t("simulation.clickToExpand")}
                        >
                            <div className="card-body">
                                <h3
                                    className={`text-sm font-semibold mb-1 ${simResults ? "group-hover:underline" : ""}`}
                                >
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
    const { t } = useTranslation();
    return (
        <SimulationProvider>
            <div className="mx-auto w-full max-w-7xl">
                <h2 className="text-4xl font-bold leading-snug mb-8">
                    {t("simulation.title")}
                </h2>

                <IndexSimulation />
            </div>
        </SimulationProvider>
    );
}
