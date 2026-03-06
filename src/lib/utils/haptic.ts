export function haptic(style: "Light" | "Medium" | "Heavy" = "Medium") {
    window.parent.postMessage({ type: "HAPTIC_FEEDBACK", payload: { style } }, "*");
}

export function hapticNotification(notificationType: "Success" | "Warning" | "Error" = "Success") {
    window.parent.postMessage(
        { type: "HAPTIC_FEEDBACK", payload: { style: "notification", notificationType } },
        "*"
    );
}
