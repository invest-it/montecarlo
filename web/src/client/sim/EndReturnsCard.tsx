import React from "react";
import { useTranslation } from "react-i18next";

export interface EndReturns {
    p10: number;
    p50: number;
    p90: number;
}

export function EndReturnsCard({
    returns,
    portfolio,
    inflation,
}: {
    returns: EndReturns;
    portfolio: number;
    inflation?: EndReturns;
}) {
    const { t } = useTranslation();
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

    const infRows: { value: number; accent: string }[] = [
        {
            value: returns.p10 / (inflation?.p10 ?? 1),
            accent: "text-error",
        },
        {
            value: returns.p50 / (inflation?.p50 ?? 1),
            accent: "text-warning",
        },
        {
            value: returns.p90 / (inflation?.p90 ?? 1),
            accent: "text-success",
        },
    ];

    return (
        <div className="mt-4">
            <span className="text-sm font-semibold block mb-2">
                {t("simulation.endReturns.title")}
            </span>
            <div className="space-y-1 grid grid-cols-3">
                {rows.map(({ label, value, accent }, idx) => (
                    <React.Fragment key={label}>
                        <span className="opacity-60 text-start">{label}</span>
                        <span className="font-mono text-end">{fmt(value)}</span>
                        <span
                            className={`font-mono font-semibold ${accent} text-end`}
                        >
                            {pct(value)}
                        </span>

                        {inflation && (
                            <>
                                <span className="opacity-30 text-start "></span>
                                <span className="font-mono text-end text-xs opacity-50">
                                    <sup>*</sup>
                                    {fmt(infRows[idx]!.value)}
                                </span>
                                <span
                                    className={`font-mono text-xs font-semibold opacity-50 ${accent} text-end`}
                                >
                                    {pct(infRows[idx]!.value)}
                                </span>
                            </>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {inflation && (
                <span className="text-xs font-semibold opacity-50 block mb-2">
                    <sup>*</sup>
                    {t("simulation.endReturns.inflationNote", {
                        rate: ((inflation.p50 - 1) * 100).toFixed(1),
                        value: fmt(portfolio / inflation.p50),
                    })}
                </span>
            )}
        </div>
    );
}
