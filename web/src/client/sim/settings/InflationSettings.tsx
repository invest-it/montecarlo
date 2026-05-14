import { useState } from "react";

export interface InflationConfig {
    rate: number;
    volatility: number;
    // Use Formula?
}

const DEFAULT_VOLATILITY = 1.315651;
const DEFAULT_RATE = 2;

interface InflationSettingsProps {
    includeInflation: boolean;
    onIncludeInflationChange: (value: boolean) => void;
    config?: InflationConfig | null;
    onConfigChange?: (value: InflationConfig | null) => void;
    isDisabled: boolean;
}

export function InflationSettings({
    isDisabled,
    includeInflation,
    onIncludeInflationChange,
    config,
    onConfigChange,
}: InflationSettingsProps) {
    const [customInflation, setCustomInflation] = useState(false);

    return (
        <div className="flex flex-col">
            <label className="flex justify-between items-center cursor-pointer mb-3">
                <span className="text-sm">Include Inflation</span>

                <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={includeInflation}
                    disabled={isDisabled}
                    onChange={(e) => onIncludeInflationChange(e.target.checked)}
                />
            </label>
            {includeInflation && (
                <div className="pl-4">
                    <label className="flex justify-between items-center cursor-pointer my-3">
                        <span className="text-sm">Use Custom Inflation</span>

                        <input
                            type="checkbox"
                            className="toggle toggle-sm"
                            checked={customInflation}
                            disabled={isDisabled}
                            onChange={(e) => {
                                setCustomInflation(e.target.checked);
                                if (!e.target.checked) {
                                    onConfigChange?.(null);
                                }
                            }}
                        />
                    </label>
                    {customInflation && (
                        <>
                            <label className="flex justify-between items-center mb-2">
                                <span className="text-sm">Rate</span>

                                <input
                                    type="number"
                                    value={config?.rate}
                                    defaultValue={DEFAULT_RATE}
                                    min={0}
                                    max={100}
                                    onChange={(e) =>
                                        onConfigChange?.({
                                            rate: parseInt(e.target.value),
                                            volatility:
                                                config?.volatility ??
                                                DEFAULT_VOLATILITY,
                                        })
                                    }
                                    className="input input-sm w-36 join-item"
                                    disabled={isDisabled}
                                />
                            </label>
                            <label className="flex justify-between items-center mb-2">
                                <span className="text-sm">Volatility</span>

                                <input
                                    type="number"
                                    value={config?.volatility}
                                    defaultValue={DEFAULT_VOLATILITY}
                                    step="0.01"
                                    min={0}
                                    max={20}
                                    onChange={(e) =>
                                        onConfigChange?.({
                                            volatility: parseFloat(
                                                e.target.value,
                                            ),
                                            rate: config?.rate ?? DEFAULT_RATE,
                                        })
                                    }
                                    className="input input-sm w-36 join-item"
                                    disabled={isDisabled}
                                />
                            </label>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
