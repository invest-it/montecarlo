import { error, value } from "@/result";
import { initWasm } from "../init-wasm";
import {
    step_averaged_monte_carlo,
    run_grouped_monte_carlo,
    run_percentile_monte_carlo,
    type InitOutput,
} from "@/wasm/core";

declare var self: Worker;

export interface InitMsg {
    type: "init";
}

export interface PingMsg {
    type: "ping";
}

export interface RunMCMsg {
    type: "run_averaged_mc" | "run_grouped_mc" | "run_percentile_mc";
    allocations: number[];
    seed?: number;
    n_groups?: number;
}

export type InboundMsg = InitMsg | PingMsg | RunMCMsg;

// ── Outbound message types ───────────────────────────────────────────────────

export interface ReadyMsg {
    type: "ready";
}
export interface ResultMsg {
    type: "result";
    result: unknown;
}

export interface MCUpdateMsg {
    type: "mc_update";
    step: number;
    update: number[];
}

export interface MCResultMsg {
    type: "mc_result";
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
    | MCUpdateMsg
    | MCResultMsg;

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

async function runGroupedMC(data: RunMCMsg) {
    if (!instance) {
        await init();
    }
    const allocation = new Float64Array(data.allocations); // your weights
    const portfolio = 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        console.log("Progress:", progress);
        send({ type: "mc_update", step: step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = run_grouped_monte_carlo(
        allocation,
        portfolio,
        data.n_groups ?? 8,
        data.seed,
        onUpdate,
    );
    const durationMs = performance.now() - t0;
    console.log("Result", result);

    send({ type: "mc_result", result, durationMs });
}

async function runAveragedMC(data: RunMCMsg) {
    if (!instance) {
        await init();
    }
    const allocation = new Float64Array(data.allocations); // your weights
    const portfolio = 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        console.log("Progress:", progress);
        send({ type: "mc_update", step: step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = step_averaged_monte_carlo(
        allocation,
        portfolio,
        data.seed,
        onUpdate,
    );
    const durationMs = performance.now() - t0;
    console.log("Result", result);

    send({ type: "mc_result", result, durationMs });
}

async function runPercentileMC(data: RunMCMsg) {
    if (!instance) {
        await init();
    }
    const allocation = new Float64Array(data.allocations);
    const portfolio = 10000;

    const onUpdate = (step: number, progress: Float64Array) => {
        send({ type: "mc_update", step: step, update: [...progress] });
    };

    const t0 = performance.now();
    const result = run_percentile_monte_carlo(
        allocation,
        portfolio,
        data.seed,
        onUpdate,
    );
    const durationMs = performance.now() - t0;

    send({ type: "mc_result", result, durationMs });
}

self.onmessage = async ({ data }: MessageEvent<InboundMsg>) => {
    switch (data.type) {
        case "init":
            init();
            break;

        case "ping":
            send({ type: "result", result: "pong" });
            break;

        case "run_averaged_mc":
            runAveragedMC(data);
            break;
        case "run_grouped_mc":
            runGroupedMC(data);
            break;
        case "run_percentile_mc":
            runPercentileMC(data);
            break;
    }
};
