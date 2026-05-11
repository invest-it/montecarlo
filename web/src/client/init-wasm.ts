// 1. Import the WebAssembly file directly.
// Bun's bundler will copy this file to your build output folder
// and resolve 'wasmUrl' to the correct public URL (e.g., '/core_bg-a1b2c3d4.wasm').
import { Err, Ok, type Result } from "@/result";
import { initSync, initThreadPool, type InitOutput } from "@/wasm/core";
import wasmUrl from "@/wasm/core_bg.wasm?url";

export async function initWasm(): Promise<Result<InitOutput, any>> {
    console.log(wasmUrl);
    // @ts-ignore
    return fetch(wasmUrl)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to load Wasm");
            console.log("Hello");
            return res.arrayBuffer();
        })
        .then((bytes) => {
            // 3. Initialize synchronously with the bytes
            const instance = initSync(bytes);
            return Ok(instance);
        })
        .catch((error) => {
            console.error(error);
            return Err(error);
        });
    // TODO: Handle error
}

export async function initThreads() {
    console.log(`${navigator.hardwareConcurrency} Threads available`);
    const threads = Math.max(2, navigator.hardwareConcurrency - 2);
    console.log(`Reserving ${threads} threads...`);

    await initThreadPool(threads).catch(console.error);
}
