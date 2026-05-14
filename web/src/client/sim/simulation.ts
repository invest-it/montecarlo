import { useCallback, useEffect, useState } from "react";
import { useContextStore } from "../common/hooks";
import { SimulationContext, useSelectedAssets } from "./SimulationProvider";
import type { OutboundMsg, RunMsgV2 } from "../workers/mc_worker";
import type { ChartAnimation } from "./animation";
import { TimeUnit } from "@/wasm/core";
import { normalize } from "./math";
import { useAssets } from "./settings/assets/data";

export interface SimResults {
    durationMs: number;
    endReturns: { p10: number; p50: number; p90: number };
    endInflation: { p10: number; p50: number; p90: number };
}

export const useSimulation = (
    charts: {
        avg?: ChartAnimation;
        grp?: ChartAnimation;
        pct?: ChartAnimation;
        avg_inflation?: ChartAnimation;
        grp_inflation?: ChartAnimation;
        pct_inflation?: ChartAnimation;
    },
    n_groups: number = 10,
) => {
    const {
        isRunning,
        setIsRunning,
        allocations,
        useYears,
        portfolio,
        seed,
        stepCount,
        includeInflation,
    } = useContextStore(SimulationContext, (s) => {
        return {
            isRunning: s.isRunning,
            setIsRunning: s.setRunning,
            allocations: s.allocations,
            useYears: s.useYears,
            portfolio: s.portfolio,
            seed: s.seed,
            stepCount: s.stepCount,
            includeInflation: s.includeInflation,
        };
    });

    const [simWorker, setSimWorker] = useState<Worker | null>(null);

    const selectedAssets = useSelectedAssets();
    const assets = useAssets();

    useEffect(() => {
        setIsRunning(simWorker !== null);
        return () => {
            simWorker?.terminate();
        };
    }, [simWorker]);

    const runSimulation = useCallback((): Promise<SimResults> => {
        if (isRunning)
            return Promise.reject(new Error("Simulation already running"));

        Object.values(charts).forEach((c) => c.reset());

        const w = new Worker(
            new URL("../workers/mc_worker.ts", import.meta.url),
            { type: "module" },
        );

        setSimWorker(w);

        const promise = new Promise<SimResults>((resolve, reject) => {
            let simDone = false;
            let pctValues: number[][] = [[], [], []];
            let pctInflationValues: number[][] = [[], [], []];

            const liveInterval = setInterval(() => {
                Object.values(charts).forEach((c) => c.advance(50));
                if (
                    simDone &&
                    Object.values(charts).every((c) => c.isAtEnd())
                ) {
                    clearInterval(liveInterval);
                }
            }, 50);

            w.onmessage = (event: MessageEvent<OutboundMsg>) => {
                if (event.data.type === "combined_update") {
                    const { step, update } = event.data;
                    Array.from(update.avg).forEach((value, i) =>
                        charts.avg?.dataRef.current[i]?.push({ step, value }),
                    );
                    charts.avg_inflation?.dataRef.current[0]?.push({
                        step,
                        value: update.avg_inflation,
                    });
                    Array.from(update.groups).forEach((value, i) =>
                        charts.grp?.dataRef.current[i]?.push({ step, value }),
                    );
                    Array.from(update.groups_inflation).forEach((value, i) =>
                        charts.grp_inflation?.dataRef.current[i]?.push({
                            step,
                            value,
                        }),
                    );
                    Array.from(update.pcts).forEach((value, i) => {
                        charts.pct?.dataRef.current[i]?.push({ step, value });
                        pctValues[i]?.push(value);
                    });
                    Array.from(update.pcts_inflation).forEach((value, i) => {
                        charts.pct_inflation?.dataRef.current[i]?.push({
                            step,
                            value,
                        });
                        pctInflationValues[i]?.push(value);
                    });
                }

                if (event.data.type === "sim_result") {
                    simDone = true;
                    w.terminate();
                    setSimWorker(null);

                    const lastOf = (s: number[]) => s[s.length - 1] ?? 0;
                    resolve({
                        durationMs: event.data.durationMs,
                        endReturns: {
                            p10: lastOf(pctValues[0] ?? []),
                            p50: lastOf(pctValues[1] ?? []),
                            p90: lastOf(pctValues[2] ?? []),
                        },
                        endInflation: {
                            p10: lastOf(pctInflationValues[0] ?? []),
                            p50: lastOf(pctInflationValues[1] ?? []),
                            p90: lastOf(pctInflationValues[2] ?? []),
                        },
                    });
                }
            };

            w.onerror = (err) => {
                clearInterval(liveInterval);
                w.terminate();
                setSimWorker(null);
                reject(err);
            };
        });

        const [assetIndices, allocValues] = Object.entries<number>(
            allocations,
        ).reduce(
            ([keys, vals], [key, val]) => {
                keys.push(assets[key]!.index);
                vals.push(val);
                return [keys, vals];
            },
            [[], []] as [number[], number[]],
        );

        const normalized = normalize(allocValues);

        const timeUnit = useYears ? TimeUnit.Months : TimeUnit.Days;
        const nSteps =
            timeUnit === TimeUnit.Months ? stepCount * 12 : stepCount;

        const msg: RunMsgV2 = {
            type: "run_combined_v2",
            allocations: normalized,
            asset_indices: assetIndices, // Must be in order of allocations which are sorted by index
            time_unit: timeUnit,
            n_steps: nSteps,
            include_inflation: includeInflation,
            seed,
            n_groups: n_groups,
            portfolio,
        };
        w.postMessage({ type: "init" });
        w.postMessage(msg);

        /* if (useYears) {
        } else {
            const msg: RunMsg = {
                type: "run_combined",
                allocations: normalized,
                seed,
                n_groups: N_GROUPS,
                portfolio,
            };
            w.postMessage({ type: "init" });
            w.postMessage(msg);
        } */

        return promise;
    }, [
        allocations,
        selectedAssets,
        assets,
        stepCount,
        seed,
        portfolio,
        useYears,
        includeInflation,
    ]);

    return {
        runSimulation,
        isRunning,
        portfolio,
        includeInflation,
    };
};
