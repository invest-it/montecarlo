import { error, value } from "@/shared/result";
import { initWasm } from "../init-wasm";
import {
    step_averaged_monte_carlo_v1,
    run_grouped_monte_carlo_v1,
    run_percentile_monte_carlo_v1,
    run_combined_monte_carlo_v1,
    run_combined_monte_carlo_v2,
    TimeUnit,
    type InitOutput,
} from "@/wasm/core";

declare var self: Worker;

export interface InitMsg {
    type: "init";
}

export interface PingMsg {
    type: "ping";
}

export interface RunMsg {
    type: "run_averaged" | "run_grouped" | "run_percentile" | "run_combined";
    allocations: number[];
    seed?: number;
    n_groups?: number;
    portfolio?: number;
}

export interface RunMsgV2 {
    type: "run_combined_v2";
    allocations: number[];
    asset_indices: number[];
    time_unit: TimeUnit;
    n_steps: number;
    include_inflation: boolean;
    seed?: number;
    n_groups?: number;
    portfolio?: number;
}

export type InboundMsg = InitMsg | PingMsg | RunMsg | RunMsgV2;

// ── Outbound message types ───────────────────────────────────────────────────

export interface ReadyMsg {
    type: "ready";
}

export interface ResultMsg {
    type: "result";
    result: unknown;
}

export interface UpdateMsg {
    type: "sim_update";
    step: number;
    update: number[];
}

export interface CombinedUpdate {
    avg: Float64Array;
    groups: Float64Array;
    pcts: Float64Array;
    avg_inflation: number;
    groups_inflation: Float64Array;
    pcts_inflation: Float64Array;
}

export interface CombinedUpdateMsg {
    type: "combined_update";
    step: number;
    update: CombinedUpdate;
}

export interface SimResultMsg {
    type: "sim_result";
    result: number;
    durationMs: number;
}

export interface ErrorMsg {
    type: "error";
    id?: number;
    msg: string;
}

export type OutboundMsg =
    | ReadyMsg
    | ResultMsg
    | ErrorMsg
    | UpdateMsg
    | CombinedUpdateMsg
    | SimResultMsg;

// ── State ────────────────────────────────────────────────────────────────────

let instance: InitOutput | null = null;

const send = (msg: OutboundMsg) => self.postMessage(msg);

async function init() {
    const result = await initWasm();
    if (!result.ok) {
        send({ type: "error", msg: String(error(result)) });
    } else {
        instance = value(result);
        send({ type: "ready" });
    }
}

async function runGrouped(data: RunMsg) {
    if (!instance) await init();
    const allocation = new Float64Array(data.allocations);
    const portfolio = data.portfolio ?? 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        send({ type: "sim_update", step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = run_grouped_monte_carlo_v1(
        allocation,
        portfolio,
        data.n_groups ?? 8,
        data.seed,
        onUpdate,
    );
    send({ type: "sim_result", result, durationMs: performance.now() - t0 });
}

async function runAveraged(data: RunMsg) {
    if (!instance) await init();
    const allocation = new Float64Array(data.allocations);
    const portfolio = data.portfolio ?? 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        send({ type: "sim_update", step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = step_averaged_monte_carlo_v1(
        allocation,
        portfolio,
        data.seed,
        onUpdate,
    );
    send({ type: "sim_result", result, durationMs: performance.now() - t0 });
}

async function runPercentile(data: RunMsg) {
    if (!instance) await init();
    const allocation = new Float64Array(data.allocations);
    const portfolio = data.portfolio ?? 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        send({ type: "sim_update", step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = run_percentile_monte_carlo_v1(
        allocation,
        portfolio,
        data.seed,
        onUpdate,
    );
    send({ type: "sim_result", result, durationMs: performance.now() - t0 });
}

async function runCombined(data: RunMsg) {
    if (!instance) await init();
    const allocation = new Float64Array(data.allocations);
    const portfolio = data.portfolio ?? 10000;

    const onUpdate = (step: number, update: CombinedUpdate) => {
        send({ type: "combined_update", step, update });
    };

    const t0 = performance.now();
    const result = run_combined_monte_carlo_v1(
        allocation,
        portfolio,
        data.n_groups ?? 8,
        data.seed,
        onUpdate,
    );
    send({ type: "sim_result", result, durationMs: performance.now() - t0 });
}

async function runCombinedV2(data: RunMsgV2) {
    if (!instance) await init();
    const allocation = new Float64Array(data.allocations);
    const asset_indices = new Uint32Array(data.asset_indices);
    const portfolio = data.portfolio ?? 10000;

    const onUpdate = (step: number, update: CombinedUpdate) => {
        send({ type: "combined_update", step, update });
    };

    const t0 = performance.now();
    const result = run_combined_monte_carlo_v2(
        asset_indices,
        allocation,
        portfolio,
        data.n_groups ?? 8,
        data.n_steps,
        data.time_unit,
        data.include_inflation,
        data.seed,
        onUpdate,
    );
    send({ type: "sim_result", result, durationMs: performance.now() - t0 });
}

self.onmessage = async ({ data }: MessageEvent<InboundMsg>) => {
    switch (data.type) {
        case "init":
            init();
            break;

        case "ping":
            send({ type: "result", result: "pong" });
            break;

        case "run_averaged":
            runAveraged(data);
            break;
        case "run_grouped":
            runGrouped(data);
            break;
        case "run_percentile":
            runPercentile(data);
            break;
        case "run_combined":
            runCombined(data);
            break;
        case "run_combined_v2":
            runCombinedV2(data);
            break;
    }
};
