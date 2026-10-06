import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import {
    CircleAlert,
    MessageCircleQuestion,
    PanelsTopLeft,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { saveToStorage } from "@/lib/utils/storage";
import { useWelcomePrefetch } from "@/lib/hooks/use-welcome-prefetch";
import { useTranslation } from "react-i18next";

type WelcomeSection = {
    key: string;
    icon: LucideIcon;
    variant?: "default" | "destructive";
};

const FIRST_LAUNCH_KEY = "firstLaunch";

const WELCOME_SECTIONS: WelcomeSection[] = [
    { key: "notAurion", icon: CircleAlert, variant: "destructive" },
    { key: "overview", icon: PanelsTopLeft },
    { key: "privacy", icon: ShieldCheck },
    { key: "support", icon: MessageCircleQuestion },
];

export function WelcomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    // Warm every cache we can while the welcome screen is shown — the
    // prefetch continues in the background; the preparation page takes
    // over (with the loading tips) if it isn't done by the time the campus
    // is chosen.
    useWelcomePrefetch();

    useEffect(() => {
        try {
            saveToStorage(FIRST_LAUNCH_KEY, "true");
        } catch (error) {
            console.error(
                "Impossible d'enregistrer l'état de premier lancement",
                error
            );
        }
    }, []);

    return (
        <PageTransition className="min-h-screen bg-mauria-bg flex flex-col">
            <motion.div
                className="flex-1 flex flex-col gap-4 px-6 pt-16 pb-10"
                variants={staggerGroup}
                initial="hidden"
                animate="show"
            >
                <motion.div
                    variants={fadeIn}
                    className="pb-2 text-center space-y-3"
                >
                    <h1 className="text-3xl font-bold">
                        {(() => {
                            const brand = t("welcome.mauria");
                            const [before, after] =
                                t("welcome.welcome").split(brand);
                            return (
                                <>
                                    {before}
                                    <span className="mauria-shimmer">
                                        {brand}
                                    </span>
                                    {after}
                                </>
                            );
                        })()}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("welcome.getStarted")}
                    </p>
                </motion.div>
                {WELCOME_SECTIONS.map(({ key, icon: Icon, variant }) => (
                    <motion.div key={key} variants={fadeIn}>
                        <Alert
                            variant={
                                variant === "destructive"
                                    ? "destructive"
                                    : undefined
                            }
                            className="w-full"
                        >
                            <Icon className="h-4 w-4" />
                            <AlertTitle>
                                {t(`welcome.sections.${key}.title`)}
                            </AlertTitle>
                            <AlertDescription>
                                {t(`welcome.sections.${key}.description`)}
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                ))}
                {/* Start button right after the info boxes, closing the
                    entrance cascade. */}
                <motion.div variants={fadeIn} className="pt-2">
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={() => navigate("/campus")}
                    >
                        {t("welcome.start")}
                    </Button>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
