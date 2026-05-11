import { useEffect, useRef, useState } from "react";
import { initWasm } from "../init-wasm";
import type { OutboundMsg, RunMsg } from "../workers/mc_worker";
import { LineChart, PercentileChart, type Point } from "../sim/LineChart";
import { AssetAllocations } from "../sim/AssetAllocations";
import { EndReturnsCard, type EndReturns } from "../sim/EndReturnsCard";

const ASSET_LABELS = [
    "Fonds",
    "Krypto",
    "Immobilien",
    "Anleihen",
    "Tagesgeld",
    "Rohstoffe",
];
const N_GROUPS = 10;
const DEFAULT_ALLOCS = [20, 15, 20, 20, 15, 10];

function normalize(allocs: number[]): number[] {
    const sum = allocs.reduce((a, b) => a + b, 0);
    if (sum === 0) return allocs.map(() => 1 / allocs.length);
    return allocs.map((v) => v / sum);
}

function useChartAnimation(n_series: number) {
    const dataRef = useRef<Point[][]>(
        Array.from({ length: n_series }, () => []),
    );
    const revealedRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [renderKey, setRenderKey] = useState(0);

    function reset() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        dataRef.current = Array.from({ length: n_series }, () => []);
        revealedRef.current = 0;
        setRenderKey(0);
    }

    function advance(steps = 1) {
        const len = dataRef.current[0]?.length ?? 0;
        if (revealedRef.current >= len) return;
        revealedRef.current = Math.min(revealedRef.current + steps, len);
        setRenderKey(revealedRef.current);
    }

    function isAtEnd() {
        return revealedRef.current >= (dataRef.current[0]?.length ?? 0);
    }

    const series = dataRef.current.map((s) => s.slice(0, renderKey));
    return {
        dataRef,
        renderKey,
        reset,
        advance,
        isAtEnd,
        series,
    };
}

export function index() {
    const [isWasmReady, setIsWasmReady] = useState(false);
    const [allocations, setAllocations] = useState(DEFAULT_ALLOCS);
    const [portfolio, setPortfolio] = useState(10000);
    const [simWorker, setSimWorker] = useState<Worker | null>(null);
    const [simDuration, setSimDuration] = useState<number | null>(null);
    const [endReturns, setEndReturns] = useState<EndReturns | null>(null);
    const [seed, setSeed] = useState(() =>
        Math.floor(Math.random() * 0x100000000),
    );

    const avg = useChartAnimation(6);
    const grp = useChartAnimation(N_GROUPS);
    const pct = useChartAnimation(3); // p10, p50, p90

    const isRunning = simWorker !== null;

    useEffect(() => {
        initWasm().then((result) => setIsWasmReady(result.ok));
    }, []);

    useEffect(
        () => () => {
            simWorker?.terminate();
        },
        [simWorker],
    );

    function runSimulation() {
        if (isRunning) return;
        setEndReturns(null);
        [avg, grp, pct].forEach((c) => c.reset());

        const w = new Worker(
            new URL("../workers/mc_worker.ts", import.meta.url),
            { type: "module" },
        );

        let simDone = false;

        const liveInterval = setInterval(() => {
            [avg, grp, pct].forEach((c) => c.advance(50));
            if (simDone && [avg, grp, pct].every((c) => c.isAtEnd())) {
                clearInterval(liveInterval);
            }
        }, 50);

        w.onmessage = (event: MessageEvent<OutboundMsg>) => {
            if (event.data.type === "combined_update") {
                const { step, update } = event.data;
                Array.from(update.avg).forEach((value, i) =>
                    avg.dataRef.current[i]?.push({ step, value }),
                );
                Array.from(update.groups).forEach((value, i) =>
                    grp.dataRef.current[i]?.push({ step, value }),
                );
                Array.from(update.pcts).forEach((value, i) =>
                    pct.dataRef.current[i]?.push({ step, value }),
                );
            }
            if (event.data.type === "sim_result") {
                simDone = true;
                setSimDuration(event.data.durationMs);
                const lastOf = (s: Point[]) => s[s.length - 1]?.value ?? 0;
                setEndReturns({
                    p10: lastOf(pct.dataRef.current[0] ?? []),
                    p50: lastOf(pct.dataRef.current[1] ?? []),
                    p90: lastOf(pct.dataRef.current[2] ?? []),
                });
                w.terminate();
                setSimWorker(null);
            }
        };

        const msg: RunMsg = {
            type: "run_combined",
            allocations: normalize(allocations),
            seed,
            n_groups: N_GROUPS,
            portfolio,
        };
        w.postMessage({ type: "init" });
        w.postMessage(msg);
        setSimWorker(w);
    }

    return (
        <div className="mx-auto p-6 lg:p-0 h-full">
            <h2 className="text-xl font-bold mb-6">
                Monte Carlo Portfolio Simulation
            </h2>

            <div className="flex flex-col lg:flex-row-reverse lg:items-start gap-6 h-full">
                {/* Controls sidebar */}

                <div className="space-y-4 lg:w-72 lg:px-5 lg:shrink-0 mb-8 lg:h-full">
                    <span className="text-lg font-medium mb-4 block">
                        Asset Allocations
                    </span>

                    <div className="flex justify-between items-center gap-2">
                        <span className="text-sm">Portfolio </span>

                        <label className="input input-sm w-32">
                            <input
                                type="number"
                                value={portfolio}
                                min={100}
                                max={100_000_000}
                                step={1000}
                                onChange={(e) =>
                                    setPortfolio(
                                        Math.max(
                                            100,
                                            Number(e.target.value) | 0,
                                        ),
                                    )
                                }
                                className="grow"
                                disabled={isRunning}
                            />
                            <span className="text-sm opacity-60 text-end">
                                €
                            </span>
                        </label>
                    </div>
                    <AssetAllocations
                        labels={ASSET_LABELS}
                        allocations={allocations}
                        onChange={setAllocations}
                        disabled={isRunning}
                    />

                    <div className="flex justify-between items-center gap-2">
                        <span className="text-sm">Seed</span>
                        <div>
                            <input
                                type="number"
                                value={seed}
                                min={0}
                                max={4294967295}
                                onChange={(e) =>
                                    setSeed(Number(e.target.value) >>> 0)
                                }
                                className="input input-sm w-36 join-item"
                                disabled={isRunning}
                            />
                            <button
                                onClick={() =>
                                    setSeed(
                                        Math.floor(Math.random() * 0x100000000),
                                    )
                                }
                                disabled={isRunning}
                                className="btn btn-sm btn-secondary join-item"
                                title="New random seed"
                            >
                                ↺
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                        <button
                            onClick={runSimulation}
                            disabled={!isWasmReady || isRunning}
                            className="btn btn-sm btn-primary"
                        >
                            {isRunning
                                ? "Running..."
                                : isWasmReady
                                  ? "Run Simulation"
                                  : "Loading WASM..."}
                        </button>
                        {simDuration !== null && !isRunning && (
                            <span className="text-xs opacity-50">
                                Took {simDuration.toFixed(0)} ms to run
                            </span>
                        )}
                    </div>

                    {endReturns && (
                        <EndReturnsCard
                            returns={endReturns}
                            portfolio={portfolio}
                        />
                    )}
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-w-0 lg:p-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-1">
                            Portfolio Percentile Lines
                        </h3>
                        <p className="text-xs text-base-content/60 mb-2">
                            P10, P50 (median), and P90 across 1,000 runs
                        </p>
                        <LineChart
                            labels={["P10", "P50", "P90"]}
                            series={pct.series}
                            renderKey={pct.renderKey}
                            showLegend
                            colors={[
                                "var(--color-error)",
                                "var(--color-warning)",
                                "var(--color-success)",
                            ]}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-1">
                            Portfolio Percentile Bands
                        </h3>
                        <p className="text-xs text-base-content/60 mb-2">
                            Shaded area = P10–P90 range · Line = median (P50)
                        </p>
                        <PercentileChart
                            series={pct.series}
                            renderKey={pct.renderKey}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-1">
                            Portfolio Outcome Groups
                        </h3>
                        <p className="text-xs text-base-content/60 mb-2">
                            {N_GROUPS} groups of runs averaged
                        </p>
                        <LineChart
                            labels={[]}
                            series={grp.series}
                            renderKey={grp.renderKey}
                            showLegend={false}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold mb-1">
                            Average Asset Value per Step
                        </h3>
                        <p className="text-xs text-base-content/60 mb-2">
                            Mean across all runs per asset (smoothed by
                            averaging — shows drift only)
                        </p>
                        <LineChart
                            labels={ASSET_LABELS}
                            series={avg.series}
                            renderKey={avg.renderKey}
                            showLegend
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
