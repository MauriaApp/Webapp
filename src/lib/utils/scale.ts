export type SizeOption = "petit" | "moyen" | "grand";

export const SCALE_STORAGE_KEY = "mauria-scale";

export const SCALE_OPTIONS: Record<SizeOption, number> = {
    petit: 0.7,
    moyen: 0.85,
    grand: 1.0,
};

const SCALE_ENTRIES = Object.entries(SCALE_OPTIONS) as [SizeOption, number][];

export const getClosestSizeOption = (scale: number): SizeOption =>
    SCALE_ENTRIES.reduce<SizeOption>((closest, [option, value]) => {
        const currentDiff = Math.abs(value - scale);
        const closestDiff = Math.abs(SCALE_OPTIONS[closest] - scale);

        return currentDiff < closestDiff ? option : closest;
    }, "grand");

export const readInitialSize = (): SizeOption => {
    if (typeof window === "undefined") {
        return "grand";
    }

    const stored = window.localStorage.getItem(SCALE_STORAGE_KEY);
    const storedScale = stored ? Number.parseFloat(stored) : Number.NaN;

    if (!Number.isNaN(storedScale)) {
        return getClosestSizeOption(storedScale);
    }

    const computedScale = Number.parseFloat(
        window
            .getComputedStyle(window.document.documentElement)
            .getPropertyValue("--mauria-scale")
    );

    if (!Number.isNaN(computedScale)) {
        return getClosestSizeOption(computedScale);
    }

    return "grand";
};

export const applyScale = (size: SizeOption) => {
    if (typeof window === "undefined") {
        return;
    }

    const scale = SCALE_OPTIONS[size];
    const root = window.document.documentElement;

    root.style.setProperty("--mauria-scale", scale.toString());
    window.localStorage.setItem(SCALE_STORAGE_KEY, scale.toString());
};
