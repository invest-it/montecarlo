import { useEffect, useState } from "react";
import { useAssets } from "./data";

const CATEGORIES: { label: string; from: number; to: number }[] = [
    { label: "Fixed Income", from: 1, to: 18 },
    { label: "Equities", from: 19, to: 34 },
    { label: "Convertibles", from: 35, to: 36 },
    { label: "Alternatives", from: 37, to: 49 },
    { label: "Hedge Funds", from: 50, to: 55 },
];

interface Props {
    selectedIndices: number[];
    onConfirm: (indices: number[]) => void;
    onCancel: () => void;
}

export function AssetSelectionForm({
    selectedIndices,
    onConfirm,
    onCancel,
}: Props) {
    const [selected, setSelected] = useState<Set<number>>(
        new Set(selectedIndices),
    );

    const assets = useAssets();

    // Keep local selection in sync when the parent changes (e.g. reset)
    useEffect(() => {
        setSelected(new Set(selectedIndices));
    }, [selectedIndices]);

    function toggle(index: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    }

    const grouped = CATEGORIES.map((cat) => ({
        ...cat,
        assets: assets.filter((a) => a.index >= cat.from && a.index <= cat.to),
    }));

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-1">
                {grouped.map((group) => (
                    <div key={group.label}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
                            {group.label}
                        </h4>
                        <div className="space-y-0.5">
                            {group.assets.map((asset) => (
                                <label
                                    key={asset.index}
                                    className="flex items-center gap-2 px-1 py-1 rounded hover:bg-base-200 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-xs"
                                        checked={selected.has(asset.index)}
                                        onChange={() => toggle(asset.index)}
                                    />
                                    <span className="flex-1 text-sm">
                                        {asset.label}
                                    </span>
                                    <span className="font-mono text-xs opacity-50 w-20 text-right">
                                        μ {(asset.mu * 100).toFixed(1)}%
                                    </span>
                                    <span className="font-mono text-xs opacity-50 w-20 text-right">
                                        σ {(asset.sigma * 100).toFixed(1)}%
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-base-300 pt-3">
                <span className="text-xs opacity-50">
                    {selected.size} asset{selected.size !== 1 ? "s" : ""}{" "}
                    selected
                </span>
                <div className="flex gap-2">
                    <button className="btn btn-sm btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={selected.size === 0}
                        onClick={() =>
                            onConfirm(
                                Array.from(selected).sort((a, b) => a - b),
                            )
                        }
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
