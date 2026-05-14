import { useTranslation } from "react-i18next";

interface PortfolioSettingsProps {
    portfolio: number;
    setPortfolio: (portfolio: number) => void;
    isDisabled: boolean;
}

export function PortfolioSettings({
    portfolio,
    setPortfolio,
    isDisabled,
}: PortfolioSettingsProps) {
    const { t } = useTranslation();
    return (
        <div className="flex justify-between items-center gap-2">
            <span className="text-sm">{t("simulation.settings.portfolio")} </span>

            <label className="input input-sm w-32">
                <input
                    type="number"
                    value={portfolio}
                    min={100}
                    max={100_000_000}
                    step={1000}
                    onChange={(e) =>
                        setPortfolio(Math.max(100, Number(e.target.value) | 0))
                    }
                    className="grow"
                    disabled={isDisabled}
                />
                <span className="text-sm opacity-60 text-end">€</span>
            </label>
        </div>
    );
}
