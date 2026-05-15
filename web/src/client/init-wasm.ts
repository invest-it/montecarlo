// 1. Import the WebAssembly file directly.
// Bun's bundler will copy this file to your build output folder
// and resolve 'wasmUrl' to the correct public URL (e.g., '/core_bg-a1b2c3d4.wasm').
import { Err, Ok, type Result } from "@/shared/result";
import { initSync, type InitOutput } from "@/wasm/core";
import wasmUrl from "@/wasm/core_bg.wasm?url";
import { useEffect, useState } from "react";

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

let wasmPromise: ReturnType<typeof initWasm> | null = null;

export function useWasm() {
    const [isWasmReady, setWasmReady] = useState(false);

    useEffect(() => {
        // 2. Only call initWasm if it hasn't been started yet
        if (!wasmPromise) {
            wasmPromise = initWasm();
        }

        // 3. All components wait for the same promise instance
        wasmPromise
            .then((result) => {
                setWasmReady(result.ok);
            })
            .catch(() => {
                setWasmReady(false);
            });
    }, []);

    return isWasmReady;
}
