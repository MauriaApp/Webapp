import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { logHaptic } from "@/lib/utils/storage";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const VIBRATION_FALLBACK: Record<HapticPattern, VibratePattern> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    error: [50, 30, 50],
};

async function triggerHaptic(pattern: HapticPattern = "light"): Promise<void> {
    try {
        switch (pattern) {
            case "light":
                await Haptics.impact({ style: ImpactStyle.Light });
                break;
            case "medium":
                await Haptics.impact({ style: ImpactStyle.Medium });
                break;
            case "heavy":
                await Haptics.impact({ style: ImpactStyle.Heavy });
                break;
            case "success":
                await Haptics.notification({ type: NotificationType.Success });
                break;
            case "error":
                await Haptics.notification({ type: NotificationType.Error });
                break;
        }
        logHaptic(pattern, true);
    } catch {
        // Fallback pour la Vibration API
        if ("vibrate" in navigator) {
            try {
                navigator.vibrate(VIBRATION_FALLBACK[pattern]);
                logHaptic(pattern, false);
            } catch { }
        }
    }
}

export function useHapticFeedback() {
    return { triggerHaptic };
}

export { triggerHaptic };
export type { HapticPattern };
