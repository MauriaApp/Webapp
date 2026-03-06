const HAPTIC_KEY = "haptic_enabled";

export function readHapticEnabled(): boolean {
    const stored = localStorage.getItem(HAPTIC_KEY);
    return stored === null ? true : stored === "true";
}

export function saveHapticEnabled(value: boolean) {
    localStorage.setItem(HAPTIC_KEY, String(value));
}

export function haptic(style: "Light" | "Medium" | "Heavy" = "Medium") {
    if (!readHapticEnabled()) return;
    window.parent.postMessage({ type: "HAPTIC_FEEDBACK", payload: { style } }, "*");
}

export function hapticNotification(notificationType: "Success" | "Warning" | "Error" = "Success") {
    if (!readHapticEnabled()) return;
    window.parent.postMessage(
        { type: "HAPTIC_FEEDBACK", payload: { style: "notification", notificationType } },
        "*"
    );
}
