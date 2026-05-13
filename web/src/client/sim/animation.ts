import { useRef, useState } from "react";
import type { Point } from "./LineChart";

export function useChartAnimation(n_series: number) {
    const dataRef = useRef<Point[][]>(
        Array.from({ length: n_series }, () => []),
    );
    const revealedRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [renderKey, setRenderKey] = useState(0);

    function reset() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        dataRef.current = Array.from({ length: n_series }, () => []);
        revealedRef.current = 0;
        setRenderKey(0);
    }

    function advance(steps = 1) {
        const len = dataRef.current[0]?.length ?? 0;
        if (revealedRef.current >= len) return;
        revealedRef.current = Math.min(revealedRef.current + steps, len);
        setRenderKey(revealedRef.current);
    }

    function isAtEnd() {
        return revealedRef.current >= (dataRef.current[0]?.length ?? 0);
    }

    const series = dataRef.current.map((s) => s.slice(0, renderKey));
    return {
        dataRef,
        renderKey,
        reset,
        advance,
        isAtEnd,
        series,
    };
}

export type ChartAnimation = ReturnType<typeof useChartAnimation>;

export interface ChartDef {
    title: string;
    description: string;
    element: React.ReactNode;
}
