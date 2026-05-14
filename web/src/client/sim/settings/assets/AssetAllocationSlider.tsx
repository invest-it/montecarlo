import type { AssetAllocationMap } from "./allocations";

interface Props {
    allocations: AssetAllocationMap;
    onChange: (allocations: AssetAllocationMap) => void;
    disabled?: boolean;
}

export function AssetAllocationSlider({
    allocations,
    onChange,
    disabled,
}: Props) {
    const keys = Object.keys(allocations);
    function handleChange(
        label: string,
        newValue: number,
        reset: boolean = false,
    ) {
        const others = keys.filter((k) => k !== label);
        const remaining = 100 - newValue;

        // 1. Calculate weights: Use current values, or 1 for equal distribution if all are 0
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

        // 2. Build the next state with floored values
        const next: AssetAllocationMap = { [label]: newValue };
        let currentSum = newValue;

        shares.forEach((s) => {
            next[s.key] = Math.floor(s.exact);
            currentSum += next[s.key]!;
        });

        // 3. Distribute the remaining integers (Largest Remainder Method)
        shares
            .sort((a, b) => (b.exact % 1) - (a.exact % 1))
            .slice(0, 100 - currentSum)
            .forEach((s) => next[s.key]!++);

        onChange(next);
    }

    return (
        <div className="flex flex-col">
            {Object.entries(allocations).map(([label, value]) => (
                <div key={label} className="flex items-center mb-2">
                    <span className="min-w-48 text-sm">{label}</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) =>
                            handleChange(label, Number(e.target.value))
                        }
                        className="w-full"
                        disabled={disabled}
                    />
                    <span className="min-w-12 text-sm text-right">
                        {value}%
                    </span>
                </div>
            ))}
            <div className="flex flex-row gap-1">
                <button
                    className="btn btn-xs"
                    onClick={() => {
                        handleChange(keys[0]!, 100);
                    }}
                >
                    Reset
                </button>
                <button
                    className="btn btn-xs"
                    onClick={() => {
                        handleChange(
                            keys[0]!,
                            parseInt((100 / keys.length).toFixed(0)),
                            true,
                        );
                    }}
                >
                    Even
                </button>
            </div>
        </div>
    );
}
