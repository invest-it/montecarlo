import { useRef, useState } from "react";
import { AssetAllocationSlider } from "./AssetAllocationSlider";
import { useContextStore } from "@/client/common/hooks";
import { SimulationContext, useSelectedAssets } from "../../SimulationProvider";
import { AssetSelectionForm } from "./AssetSelectionForm";
import { useAssets } from "./data";
import { useWasm } from "@/client/init-wasm";

export function AssetSettings() {
    const { allocations, setAllocations, isRunning, setSelectedAssets } =
        useContextStore(SimulationContext, (state) => {
            return {
                allocations: state.allocations,
                setAllocations: state.setAllocations,
                isRunning: state.isRunning,
                setSelectedAssets: state.setSelectedAssets,
            };
        });

    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const assetModalRef = useRef<HTMLDialogElement>(null);

    const assets = useAssets();
    const selectedAssets = useSelectedAssets();
    const isWasmReady = useWasm();

    return (
        <div>
            <span className="text-md font-medium mb-4 block">
                Asset Allocations
            </span>

            <AssetAllocationSlider
                allocations={allocations}
                onChange={setAllocations}
                disabled={isRunning}
            />

            {isWasmReady && (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs opacity-50">
                            {selectedAssets.byLabel.length} assets (v2)
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
                                    assets={assets}
                                    selectedAssets={selectedAssets.byLabel}
                                    onConfirm={(labels) => {
                                        setSelectedAssets(labels);
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
