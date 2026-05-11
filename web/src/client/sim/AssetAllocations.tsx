interface Props {
    labels: string[];
    allocations: number[];
    onChange: (allocations: number[]) => void;
    disabled?: boolean;
}

export function AssetAllocations({
    labels,
    allocations,
    onChange,
    disabled,
}: Props) {
    function handleChange(i: number, newValue: number) {
        const remaining = 100 - newValue;
        const next = [...allocations];
        next[i] = newValue;

        const others = labels.map((_, j) => j).filter((j) => j !== i);
        const othersSum = others.reduce(
            (sum, j) => sum + (allocations[j] ?? 0),
            0,
        );

        if (othersSum === 0) {
            // Distribute remaining equally across the other sliders
            const base = Math.floor(remaining / others.length);
            others.forEach((j, k) => {
                next[j] = k < remaining % others.length ? base + 1 : base;
            });
        } else {
            // Largest remainder method: floor each share, then give +1 to the
            // highest-fractional slots until the total reaches `remaining`.
            // Guarantees all values >= 0 and an exact sum of 100.
            const exact = others.map(
                (j) => ((allocations[j] ?? 0) / othersSum) * remaining,
            );
            others.forEach((j, k) => {
                next[j] = Math.floor(exact[k]!);
            });
            const leftover =
                remaining - others.reduce((sum, j) => sum + (next[j] ?? 0), 0);
            others
                .map((j, k) => ({ j, frac: exact[k]! % 1 }))
                .sort((a, b) => b.frac - a.frac)
                .slice(0, leftover)
                .forEach(({ j }) => {
                    next[j] = (next[j] ?? 0) + 1;
                });
        }

        onChange(next);
    }

    return (
        <div>
            {labels.map((label, i) => (
                <div key={label} className="flex items-center mb-2">
                    <span className="min-w-20 text-sm">{label}</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={allocations[i]}
                        onChange={(e) =>
                            handleChange(i, Number(e.target.value))
                        }
                        className="w-full"
                        disabled={disabled}
                    />
                    <span className="min-w-12 text-sm text-right">
                        {allocations[i]}%
                    </span>
                </div>
            ))}
        </div>
    );
}
