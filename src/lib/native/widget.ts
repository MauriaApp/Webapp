import { WidgetLesson } from "@/lib/utils/home";

// Pont vers le shell natif (MauriaPWA2). Le plugin Capacitor "MauriaWidget"
// n'existe que dans l'app Android ; ailleurs (navigateur, iOS) on ne fait rien.
//
// On tape directement le bridge injecte par Capacitor pour eviter d'ajouter
// @capacitor/core comme dependance du Webapp.

export type WidgetGradePoint = {
    student: number | null;
    class: number | null;
};

export type WidgetRecentGrade = {
    subject: string; // intitule de l'epreuve (titre de la GradeCard)
    badge: string | null; // libelle du type de note, comme le Badge de la carte
    value: number;
    scale: number;
    classAvg: number | null;
    coefficient: number | null;
    date: string | null; // ISO (YYYY-MM-DD)
};

export type WidgetSubjectAvg = {
    subject: string;
    student: number | null;
    class: number | null;
};

export type WidgetGradesPayload = {
    scale: number;
    overallStudent: number | null;
    overallClass: number | null;
    evolution: WidgetGradePoint[];
    recent: WidgetRecentGrade[];
    bySubject: WidgetSubjectAvg[];
};

type MauriaWidgetPlugin = {
    update: (data: { lessons: WidgetLesson[] }) => Promise<void>;
    updateGrades: (data: WidgetGradesPayload) => Promise<void>;
    updateTheme: (data: { theme: string }) => Promise<void>;
};

type CapacitorBridge = {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: { MauriaWidget?: MauriaWidgetPlugin };
};

const getBridge = (): CapacitorBridge | undefined =>
    (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;

function getPlugin(): MauriaWidgetPlugin | undefined {
    const cap = getBridge();
    if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return;
    return cap.Plugins?.MauriaWidget;
}

// Permet aux appelants d'eviter de construire un payload pour rien : hors
// shell Android, aucun widget ne le lira.
export const hasWidgetPlugin = (): boolean => getPlugin() !== undefined;

export async function pushWidgetPlanning(lessons: WidgetLesson[]): Promise<void> {
    const plugin = getPlugin();
    if (!plugin) return; // navigateur, iOS, ou shell sans le plugin
    try {
        await plugin.update({ lessons });
    } catch (e) {
        console.warn("widget planning update failed", e);
    }
}

export async function pushWidgetGrades(
    payload: WidgetGradesPayload
): Promise<void> {
    const plugin = getPlugin();
    if (!plugin?.updateGrades) return;
    try {
        await plugin.updateGrades(payload);
    } catch (e) {
        console.warn("widget grades update failed", e);
    }
}

// Theme choisi dans l'app : les widgets natifs le rejouent avec leur propre
// palette (MauriaPWA2, WidgetPalette generee depuis globals.css).
export async function pushWidgetTheme(theme: string): Promise<void> {
    const plugin = getPlugin();
    if (!plugin) return;
    try {
        await plugin.updateTheme({ theme });
    } catch (e) {
        console.warn("widget theme update failed", e);
    }
}
