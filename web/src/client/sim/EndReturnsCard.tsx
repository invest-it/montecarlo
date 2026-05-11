export interface EndReturns {
    p10: number;
    p50: number;
    p90: number;
}

export function EndReturnsCard({
    returns,
    portfolio,
}: {
    returns: EndReturns;
    portfolio: number;
}) {
    const fmt = (v: number) =>
        v.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        });
    const pct = (v: number) => {
        const r = ((v - portfolio) / portfolio) * 100;
        return `${r >= 0 ? "+" : ""}${r.toFixed(1)}%`;
    };
    const rows: { label: string; value: number; accent: string }[] = [
        { label: "P10", value: returns.p10, accent: "text-error" },
        { label: "P50", value: returns.p50, accent: "text-warning" },
        { label: "P90", value: returns.p90, accent: "text-success" },
    ];
    return (
        <div className="mt-4">
            <span className="text-sm font-semibold block mb-2">
                End Returns
            </span>
            <div className="space-y-1 grid grid-cols-3">
                {rows.map(({ label, value, accent }) => (
                    <>
                        <span className="opacity-60 text-start">{label}</span>
                        <span className="font-mono text-end">{fmt(value)}</span>
                        <span
                            className={`font-mono font-semibold ${accent} text-end`}
                        >
                            {pct(value)}
                        </span>
                    </>
                ))}
            </div>
        </div>
    );
}
