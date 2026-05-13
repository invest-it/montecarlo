import { useContextStore } from "@/client/common/hooks";
import { SimulationContext } from "../SimulationProvider";
import { Info } from "lucide-react";

export function StepSettings() {
    const { useYears, setUseYears, stepCount, setStepCount, isRunning } =
        useContextStore(SimulationContext, (state) => {
            return {
                useYears: state.useYears,
                setUseYears: state.setUseYears,
                stepCount: state.stepCount,
                setStepCount: state.setStepCount,
                isRunning: state.isRunning,
            };
        });

    return (
        <>
            <div className="flex justify-between items-center gap-2">
                <div>
                    <span className="text-sm mr-1">
                        {useYears ? "Years" : "Days"}
                    </span>
                    {!useYears && (
                        <div
                            className="tooltip tooltip-right"
                            data-tip="The simulation uses trading days, so 250 days = 1 year"
                        >
                            <Info size={12} />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={stepCount}
                        min={1}
                        max={useYears ? 50 : 5000}
                        onChange={(e) =>
                            setStepCount(
                                Math.max(1, Number(e.target.value) | 0),
                            )
                        }
                        className="input input-sm w-20"
                        disabled={isRunning}
                    />

                    <label className="flex items-center gap-1 text-xs opacity-60 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="toggle toggle-xs"
                            checked={useYears}
                            onChange={(e) => {
                                setUseYears(e.target.checked);
                                if (e.target.checked) {
                                    setStepCount(20);
                                } else {
                                    setStepCount(2000);
                                }
                            }}
                            disabled={isRunning}
                        />
                        Yrs
                    </label>
                </div>
            </div>
            {useYears && (
                <p className="text-xs opacity-50 -mt-2">
                    → {stepCount * 12} monthly steps (v2 engine)
                </p>
            )}
        </>
    );
}
