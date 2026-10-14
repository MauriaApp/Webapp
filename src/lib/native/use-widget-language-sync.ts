import { useEffect } from "react";

import i18n from "@/i18n";
import { hasWidgetPlugin, pushWidgetLanguage } from "@/lib/native/widget";

/**
 * Pousse la langue de l'app aux widgets Android.
 *
 * i18next emet "languageChanged" au demarrage (la sidebar reapplique la
 * langue stockee) comme au changement dans les reglages ou sur le login :
 * un seul ecouteur couvre donc tous les cas, et le premier push au montage
 * rattrape le cas ou l'evenement a deja eu lieu.
 */
export function useWidgetLanguageSync() {
    useEffect(() => {
        // Hors shell Android, personne ne lira la langue : no-op.
        if (!hasWidgetPlugin()) return;

        const push = (lng: string) => void pushWidgetLanguage(lng);
        push(i18n.language);
        i18n.on("languageChanged", push);
        return () => {
            i18n.off("languageChanged", push);
        };
    }, []);
}
