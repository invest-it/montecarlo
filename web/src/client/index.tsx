import { useEffect, useRef, useState } from "react";
import { initWasm } from "./init-wasm";
import type { OutboundMsg, RunMCMsg } from "./workers/mc_worker";
import { LineChart, PercentileChart, type Point } from "./sim/LineChart";
import { AssetAllocations } from "./AssetAllocations";

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

    function startAnimation() {
        if (intervalRef.current) clearInterval(intervalRef.current);
        revealedRef.current = 0;
        const total = dataRef.current[0]?.length ?? 0;
        intervalRef.current = setInterval(() => {
            revealedRef.current += 1;
            setRenderKey(revealedRef.current);
            if (revealedRef.current >= total) {
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
            }
        }, 4);
    }

    const series = dataRef.current.map((s) => s.slice(0, renderKey));

    return { dataRef, renderKey, reset, startAnimation, series };
}

export function index() {
    const [isWasmReady, setIsWasmReady] = useState(false);
    const [allocations, setAllocations] = useState(DEFAULT_ALLOCS);
    const [avgWorker, setAvgWorker] = useState<Worker | null>(null);
    const [grpWorker, setGrpWorker] = useState<Worker | null>(null);
    const [pctWorker, setPctWorker] = useState<Worker | null>(null);
    const [avgDuration, setAvgDuration] = useState<number | null>(null);
    const [grpDuration, setGrpDuration] = useState<number | null>(null);
    const [pctDuration, setPctDuration] = useState<number | null>(null);
    const [seed, setSeed] = useState(() =>
        Math.floor(Math.random() * 0x100000000),
    );

    const avg = useChartAnimation(6);
    const grp = useChartAnimation(N_GROUPS);
    const pct = useChartAnimation(3); // p10, p50, p90

    const isRunning = avgWorker !== null || grpWorker !== null || pctWorker !== null;

    useEffect(() => {
        initWasm().then((result) => setIsWasmReady(result.ok));
    }, []);

    useEffect(
        () => () => {
            avgWorker?.terminate();
        },
        [avgWorker],
    );
    useEffect(
        () => () => {
            grpWorker?.terminate();
        },
        [grpWorker],
    );
    useEffect(
        () => () => {
            pctWorker?.terminate();
        },
        [pctWorker],
    );

    function spawnWorker(
        msg: RunMCMsg,
        chart: ReturnType<typeof useChartAnimation>,
        setWorker: (w: Worker | null) => void,
        setDuration: (ms: number) => void,
    ) {
        chart.reset();
        const w = new Worker(
            new URL("./workers/mc_worker.ts", import.meta.url),
            { type: "module" },
        );
        w.onmessage = (event: MessageEvent<OutboundMsg>) => {
            if (event.data.type === "mc_update") {
                const { step, update } = event.data;
                update.forEach((value, i) => {
                    chart.dataRef.current[i]?.push({ step, value });
                });
            }
            if (event.data.type === "mc_result") {
                setDuration(event.data.durationMs);
                w.terminate();
                setWorker(null);
                chart.startAnimation();
            }
        };
        w.postMessage({ type: "init" });
        w.postMessage(msg);
        setWorker(w);
    }

    function runSimulation() {
        if (isRunning) return;
        const allocs = normalize(allocations);
        spawnWorker(
            { type: "run_averaged_mc", allocations: allocs, seed },
            avg,
            setAvgWorker,
            setAvgDuration,
        );
        spawnWorker(
            {
                type: "run_grouped_mc",
                allocations: allocs,
                seed,
                n_groups: N_GROUPS,
            },
            grp,
            setGrpWorker,
            setGrpDuration,
        );
        spawnWorker(
            { type: "run_percentile_mc", allocations: allocs, seed },
            pct,
            setPctWorker,
            setPctDuration,
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">
                Monte Carlo Portfolio Simulation
            </h2>

            <AssetAllocations
                labels={ASSET_LABELS}
                allocations={allocations}
                onChange={setAllocations}
                disabled={isRunning}
            />

            <div className="flex items-center gap-2">
                <span className="text-sm">Seed</span>
                <input
                    type="number"
                    value={seed}
                    min={0}
                    max={4294967295}
                    onChange={(e) => setSeed(Number(e.target.value) >>> 0)}
                    className="input input-sm w-36"
                    disabled={isRunning}
                />
                <button
                    onClick={() =>
                        setSeed(Math.floor(Math.random() * 0x100000000))
                    }
                    disabled={isRunning}
                    className="btn btn-sm btn-ghost"
                    title="New random seed"
                >
                    ↺
                </button>
            </div>

            <div className="flex items-center gap-4">
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
                {(avgDuration !== null || grpDuration !== null || pctDuration !== null) && !isRunning && (
                    <span className="text-xs opacity-50">
                        {[
                            avgDuration !== null && `avg ${avgDuration.toFixed(1)} ms`,
                            grpDuration !== null && `grouped ${grpDuration.toFixed(1)} ms`,
                            pctDuration !== null && `pct ${pctDuration.toFixed(1)} ms`,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </span>
                )}
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-1">
                    Portfolio Percentile Bands
                </h3>
                <p className="text-xs text-base-content/60 mb-2">
                    Shaded area = P10–P90 range across 1,000 runs · Line = median (P50)
                </p>
                <PercentileChart series={pct.series} renderKey={pct.renderKey} />
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
                    Mean across all runs per asset (smoothed by averaging — shows drift only)
                </p>
                <LineChart
                    labels={ASSET_LABELS}
                    series={avg.series}
                    renderKey={avg.renderKey}
                    showLegend
                />
            </div>
        </div>
    );
}
