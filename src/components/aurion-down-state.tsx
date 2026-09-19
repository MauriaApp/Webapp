import { ServerCrash } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Empty-state content for pages backed by Aurion when there's nothing cached
 * and Aurion is down: a spinner would lead nowhere, so say why instead.
 * Meant to be rendered inside the page's empty-state card.
 */
export function AurionDownState({ message }: { message: string }) {
    const { t } = useTranslation();

    return (
        <>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ServerCrash className="w-8 h-8 text-red-500 dark:text-red-300 oled:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
                {t("homePage.aurionDownTitle")}
            </h3>
            <p className="text-muted-foreground">{message}</p>
        </>
    );
}
