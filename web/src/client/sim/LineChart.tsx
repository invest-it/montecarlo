import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface Point {
    step: number;
    value: number;
}

interface Props {
    labels: string[];
    series: Point[][];
    renderKey: number;
    showLegend?: boolean;
    colors?: string[];
}

const H = 320;
const MT = 16;
const MB = 32;
const ML = 60;
const MR_LEGEND = 120;
const MR_BARE = 16;

const X_TICKS = 5;
const Y_TICKS = 4;
const N_STEPS = 1250;

const COLORS = d3.schemeTableau10;
const color = (i: number): string => COLORS[i % COLORS.length] ?? "steelblue";

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
    const [width, setWidth] = useState(500);
    useEffect(() => {
        if (!ref.current) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width;
            if (w) setWidth(w);
        });
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, [ref]);
    return width;
}

interface PercentileChartProps {
    // series[0] = p10, series[1] = p50, series[2] = p90
    series: Point[][];
    renderKey: number;
}

export function PercentileChart({ series, renderKey }: PercentileChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const W = useContainerWidth(containerRef);

    useEffect(() => {
        if (!svgRef.current) return;

        const IW = W - ML - MR_BARE;
        const IH = H - MT - MB;

        const [p10, p50, p90] = series;
        if (!p10 || !p50 || !p90) return;

        const allValues = [...p10, ...p90].map((p) => p.value);
        const hasData = allValues.length > 0;

        const yMin = hasData ? (d3.min(allValues) ?? 0) : 0;
        const yMax = hasData ? (d3.max(allValues) ?? 1) : 1;
        const maxStep = hasData
            ? (d3.max(p50.map((p) => p.step)) ?? N_STEPS)
            : N_STEPS;

        const px = (step: number) => (step / maxStep) * IW;
        const py = (value: number) =>
            IH - ((value - yMin) / (yMax - yMin)) * IH;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g").attr("transform", `translate(${ML},${MT})`);

        // X axis
        g.append("line")
            .attr("x1", 0)
            .attr("x2", IW)
            .attr("y1", IH)
            .attr("y2", IH)
            .attr("stroke", "currentColor")
            .attr("stroke-width", 0.5);

        for (let i = 0; i <= X_TICKS; i++) {
            const step = Math.round((i / X_TICKS) * maxStep);
            const x = px(step);
            g.append("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", IH)
                .attr("y2", IH + 4)
                .attr("stroke", "currentColor");
            g.append("text")
                .attr("x", x)
                .attr("y", IH + 16)
                .attr("text-anchor", "middle")
                .attr("font-size", 10)
                .attr("fill", "currentColor")
                .text(step);
        }

        // Y axis
        g.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", IH)
            .attr("stroke", "currentColor")
            .attr("stroke-width", 0.5);

        for (let i = 0; i <= Y_TICKS; i++) {
            const value = yMin + (i / Y_TICKS) * (yMax - yMin);
            const y = py(value);
            g.append("line")
                .attr("x1", -4)
                .attr("x2", 0)
                .attr("y1", y)
                .attr("y2", y)
                .attr("stroke", "currentColor");
            g.append("text")
                .attr("x", -8)
                .attr("y", y + 4)
                .attr("text-anchor", "end")
                .attr("font-size", 10)
                .attr("fill", "currentColor")
                .text(`€${value.toFixed(0)}`);
        }

        // P10–P90 shaded band
        const len = Math.min(p10.length, p90.length);
        if (len > 1) {
            const bandD = [
                ...p10
                    .slice(0, len)
                    .map(
                        (pt, j) =>
                            `${j === 0 ? "M" : "L"}${px(pt.step)},${py(pt.value)}`,
                    ),
                ...p90
                    .slice(0, len)
                    .toReversed()
                    .map((pt) => `L${px(pt.step)},${py(pt.value)}`),
                "Z",
            ].join(" ");
            g.append("path")
                .attr("d", bandD)
                .attr("fill", "steelblue")
                .attr("opacity", 0.2);
        }

        // P50 median line
        if (p50.length > 1) {
            const medianD = p50
                .map(
                    (pt, j) =>
                        `${j === 0 ? "M" : "L"}${px(pt.step)},${py(pt.value)}`,
                )
                .join(" ");
            g.append("path")
                .attr("d", medianD)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);
        }

        // Inline legend (top-left of chart area)
        const legend = g.append("g").attr("transform", "translate(8, 8)");
        legend
            .append("rect")
            .attr("width", 16)
            .attr("height", 10)
            .attr("fill", "steelblue")
            .attr("opacity", 0.2);
        legend
            .append("text")
            .attr("x", 20)
            .attr("y", 9)
            .attr("font-size", 11)
            .attr("fill", "currentColor")
            .text("P10–P90");
        legend
            .append("line")
            .attr("x1", 0)
            .attr("x2", 16)
            .attr("y1", 24)
            .attr("y2", 24)
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);
        legend
            .append("text")
            .attr("x", 20)
            .attr("y", 28)
            .attr("font-size", 11)
            .attr("fill", "currentColor")
            .text("Median (P50)");
    }, [renderKey, W]);

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <svg ref={svgRef} width={W} height={H} />
        </div>
    );
}

export function LineChart({
    labels,
    series,
    renderKey,
    showLegend = true,
    colors: colorOverrides,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const W = useContainerWidth(containerRef);

    useEffect(() => {
        if (!svgRef.current) return;

        const MR = showLegend ? MR_LEGEND : MR_BARE;
        const IW = W - ML - MR;
        const IH = H - MT - MB;

        const allValues = series.flatMap((s) => s.map((p) => p.value));
        const hasData = allValues.length > 0;

        const yMin = hasData ? (d3.min(allValues) ?? 0) : 90;
        const yMax = hasData ? (d3.max(allValues) ?? 1) : 110;
        const maxStep = hasData
            ? (d3.max(series.flatMap((s) => s.map((p) => p.step))) ?? N_STEPS)
            : N_STEPS;

        // Linear projection: data coords → pixel coords
        const px = (step: number) => (step / maxStep) * IW;
        const py = (value: number) =>
            IH - ((value - yMin) / (yMax - yMin)) * IH;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g").attr("transform", `translate(${ML},${MT})`);

        // X axis
        g.append("line")
            .attr("x1", 0)
            .attr("x2", IW)
            .attr("y1", IH)
            .attr("y2", IH)
            .attr("stroke", "currentColor")
            .attr("stroke-width", 0.5);

        for (let i = 0; i <= X_TICKS; i++) {
            const step = Math.round((i / X_TICKS) * maxStep);
            const x = px(step);
            g.append("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", IH)
                .attr("y2", IH + 4)
                .attr("stroke", "currentColor");
            g.append("text")
                .attr("x", x)
                .attr("y", IH + 16)
                .attr("text-anchor", "middle")
                .attr("font-size", 10)
                .attr("fill", "currentColor")
                .text(step);
        }

        // Y axis
        g.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", IH)
            .attr("stroke", "currentColor")
            .attr("stroke-width", 0.5);

        for (let i = 0; i <= Y_TICKS; i++) {
            const value = yMin + (i / Y_TICKS) * (yMax - yMin);
            const y = py(value);
            g.append("line")
                .attr("x1", -4)
                .attr("x2", 0)
                .attr("y1", y)
                .attr("y2", y)
                .attr("stroke", "currentColor");
            g.append("text")
                .attr("x", -8)
                .attr("y", y + 4)
                .attr("text-anchor", "end")
                .attr("font-size", 10)
                .attr("fill", "currentColor")
                .text(`€${value.toFixed(0)}`);
        }

        const resolveColor = (i: number) =>
            colorOverrides?.[i] ?? color(i);

        // Lines
        series.forEach((s, i) => {
            if (s.length < 2) return;
            const d = s
                .map(
                    (p, j) =>
                        `${j === 0 ? "M" : "L"}${px(p.step)},${py(p.value)}`,
                )
                .join(" ");
            g.append("path")
                .attr("d", d)
                .attr("fill", "none")
                .attr("stroke", resolveColor(i))
                .attr("stroke-width", 1.5);
        });

        // Legend
        if (showLegend) {
            const legend = g
                .append("g")
                .attr("transform", `translate(${IW + 12}, 0)`);
            labels.forEach((label, i) => {
                const row = legend
                    .append("g")
                    .attr("transform", `translate(0, ${i * 18})`);
                row.append("line")
                    .attr("x1", 0)
                    .attr("x2", 16)
                    .attr("y1", 7)
                    .attr("y2", 7)
                    .attr("stroke", resolveColor(i))
                    .attr("stroke-width", 2);
                row.append("text")
                    .attr("x", 20)
                    .attr("y", 11)
                    .attr("font-size", 11)
                    .attr("fill", "currentColor")
                    .text(label);
            });
        }
    }, [renderKey, showLegend, W]);

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <svg ref={svgRef} width={W} height={H} />
        </div>
    );
}
