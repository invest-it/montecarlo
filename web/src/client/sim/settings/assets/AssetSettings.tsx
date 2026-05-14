import { useEffect, useRef, useState } from "react";
import { AssetAllocationSlider } from "./AssetAllocationSlider";
import { useContextStore } from "@/client/common/hooks";
import { SimulationContext, useSelectedAssets } from "../../SimulationProvider";
import { AssetSelectionForm } from "./AssetSelectionForm";
import { get_available_assets } from "@/wasm/core";
import { useAssetStore, type AssetInfo } from "./data";
import { useShallow } from "zustand/react/shallow";

export function AssetSettings() {
    const {
        allocations,
        setAllocations,
        isRunning,
        isWasmReady,
        assetIndices,
        setAssetIndices,
    } = useContextStore(SimulationContext, (state) => {
        return {
            allocations: state.allocations,
            setAllocations: state.setAllocations,
            isRunning: state.isRunning,
            isWasmReady: state.isWasmReady,

            assetIndices: state.assetIndices,
            setAssetIndices: state.setAssetIndices,
        };
    });

    const [_, setAssets] = useAssetStore(
        useShallow((state) => [state.assets, state.setAssets]),
    );
    useEffect(() => {
        if (isWasmReady) {
            const parsed = JSON.parse(get_available_assets()) as AssetInfo[];
            setAssets(parsed);
        }
    }, [isWasmReady]);

    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const assetModalRef = useRef<HTMLDialogElement>(null);

    const selectedAssets = useSelectedAssets();

    return (
        <div>
            <span className="text-md font-medium mb-4 block">
                Asset Allocations
            </span>

            <AssetAllocationSlider
                labels={selectedAssets.map((a) => a.label)}
                allocations={allocations}
                onChange={setAllocations}
                disabled={isRunning}
            />

            {isWasmReady && (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs opacity-50">
                            {assetIndices.length} assets (v2)
                        </span>
                        <button
                            className="btn btn-xs btn-outline"
                            disabled={isRunning}
                            onClick={() => {
                                setAssetModalOpen(true);
                                assetModalRef.current?.showModal();
                            }}
                        >
                            Select Assets
                        </button>
                    </div>
                    <dialog ref={assetModalRef} className="modal">
                        <div className="modal-box max-w-2xl">
                            <form method="dialog">
                                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                    ✕
                                </button>
                            </form>
                            <h3 className="font-bold text-lg mb-4">
                                Select Assets
                            </h3>
                            {assetModalOpen && (
                                <AssetSelectionForm
                                    selectedIndices={assetIndices}
                                    onConfirm={(indices) => {
                                        setAssetIndices(indices);
                                        assetModalRef.current?.close();
                                    }}
                                    onCancel={() =>
                                        assetModalRef.current?.close()
                                    }
                                />
                            )}
                        </div>
                        <form method="dialog" className="modal-backdrop">
                            <button>close</button>
                        </form>
                    </dialog>
                </div>
            )}
        </div>
    );
}
