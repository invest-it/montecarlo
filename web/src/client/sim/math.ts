export function normalize(allocs: number[]): number[] {
    const sum = allocs.reduce((a, b) => a + b, 0);
    if (sum === 0) return allocs.map(() => 1 / allocs.length);
    return allocs.map((v) => v / sum);
}
