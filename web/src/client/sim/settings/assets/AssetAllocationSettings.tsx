import { useMemo, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import type { AssetAllocationMap } from "./allocations";
import _ from "lodash";
import type { AssetInfoMap } from "./data";

interface AssetAllocationSliderProps {
    label: string;
    value: number;
    onChange: (label: string, value: number) => void;
    disabled?: boolean;
}

function AssetAllocationSlider({
    label,
    value,
    onChange,
    disabled,
}: AssetAllocationSliderProps) {
    const [editingLabel, setEditingLabel] = useState<string | null>(null);
    const [localValue, setLocalValue] = useState<string>("");

    return (
        <div key={label} className="flex items-center mb-2 group">
            {/* Label Container with daisyUI Tooltip */}
            <div
                className="tooltip tooltip-left before:text-xs"
                data-tip={label}
            >
                <span
                    className="
                        block w-32 text-sm text-gray-600 text-left cursor-help
                        truncate
                        [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]
                    "
                >
                    {label}
                </span>
            </div>

            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onChange(label, Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg  cursor-pointer accent-primary mr-4"
                disabled={disabled}
            />

            <label
                className={`flex items-center min-w-12 justify-end ${disabled ? "cursor-not-allowed" : "cursor-text"}`}
            >
                <input
                    type="text"
                    inputMode="numeric"
                    value={editingLabel === label ? localValue : value}
                    onFocus={() => {
                        setEditingLabel(label);
                        setLocalValue(value.toString());
                    }}
                    onBlur={() => setEditingLabel(null)}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^[0-9]+$/.test(val)) {
                            const numVal = val === "" ? 0 : Number(val);
                            if (numVal <= 100) {
                                setLocalValue(val);
                                onChange(label, numVal);
                            }
                        }
                    }}
                    disabled={disabled}
                    className={`
                            w-8 text-right text-sm font-medium bg-transparent
                            border-none p-0 focus:ring-0 focus:outline-none focus-visible:outline-none
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                            ${disabled ? "cursor-not-allowed text-gray-400" : "cursor-text hover:text-primary focus:text-primary"}
                        `}
                />
                <span
                    className={`text-sm font-medium ml-0.5 ${disabled ? "text-gray-400" : "group-hover:text-primary"}`}
                >
                    %
                </span>
            </label>
        </div>
    );
}

interface AssetAllocationSettingsProps {
    allocations: AssetAllocationMap;
    assets: AssetInfoMap;
    onChange: (allocations: AssetAllocationMap) => void;
    disabled?: boolean;
}

export function AssetAllocationSettings({
    allocations,
    assets,
    onChange,
    disabled,
}: AssetAllocationSettingsProps) {
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();

    const sortedKeys = useMemo(() => {
        return Object.keys(allocations).sort(
            (a, b) => (assets[a]?.index ?? 0) - (assets[b]?.index ?? 0),
        );
    }, [Object.keys(allocations).sort().join(","), assets]);

    function handleChange(
        label: string,
        newValue: number,
        reset: boolean = false,
    ) {
        const others = sortedKeys.filter((k) => k !== label);
        const remaining = 100 - newValue;

        const totalWeight = others.reduce(
            (sum, k) => sum + (reset ? 0 : allocations[k] || 0),
            0,
        );

        const shares = others.map((key) => ({
            key,
            exact:
                ((reset ? 0 : allocations[key] || 0) || 1 / others.length) *
                (totalWeight ? remaining / totalWeight : remaining),
        }));

        const next: AssetAllocationMap = { [label]: newValue };
        let currentSum = newValue;

        shares.forEach((s) => {
            next[s.key] = Math.floor(s.exact);
            currentSum += next[s.key]!;
        });

        // Largest Remainder Method to ensure total is exactly 100
        shares
            .sort((a, b) => (b.exact % 1) - (a.exact % 1))
            .slice(0, 100 - currentSum)
            .forEach((s) => next[s.key]!++);

        onChange(next);
    }

    return (
        <div className="flex flex-col w-full max-w-2xl gap-1">
            {sortedKeys.map((label) => (
                <AssetAllocationSlider
                    key={label}
                    label={label}
                    value={allocations[label] || 0}
                    onChange={(label, value) => {
                        startTransition(() => handleChange(label, value));
                    }}
                    disabled={disabled}
                />
            ))}

            {/* Control Buttons */}
            <div className="flex flex-row gap-2 mt-4">
                <button
                    className="btn btn-xs btn-ghost bg-base-200"
                    onClick={() => handleChange(sortedKeys[0]!, 100)}
                    disabled={disabled}
                >
                    {t("simulation.settings.reset")}
                </button>
                <button
                    className="btn btn-xs btn-ghost bg-base-200"
                    onClick={() =>
                        handleChange(
                            sortedKeys[0]!,
                            Math.round(100 / sortedKeys.length),
                            true,
                        )
                    }
                    disabled={disabled}
                >
                    {t("simulation.settings.evenDistribution")}
                </button>
            </div>
        </div>
    );
}
