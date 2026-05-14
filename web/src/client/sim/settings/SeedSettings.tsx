interface SeedSettingsProps {
    seed: number;
    setSeed: (seed: number) => void;
    isDisabled: boolean;
}

export function SeedSettings({ seed, setSeed, isDisabled }: SeedSettingsProps) {
    return (
        <div className="flex justify-between items-center gap-2">
            <span className="text-sm">Seed</span>
            <div>
                <input
                    type="number"
                    value={seed}
                    min={0}
                    max={4294967295}
                    onChange={(e) => setSeed(Number(e.target.value) >>> 0)}
                    className="input input-sm w-36 join-item"
                    disabled={isDisabled}
                />
                <button
                    onClick={() =>
                        setSeed(Math.floor(Math.random() * 0x100000000))
                    }
                    disabled={isDisabled}
                    className="btn btn-sm btn-secondary join-item"
                    title="New random seed"
                >
                    ↺
                </button>
            </div>
        </div>
    );
}
