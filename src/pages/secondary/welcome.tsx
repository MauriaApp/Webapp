import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    CircleAlert,
    Hand,
    MessageCircleQuestion,
    PanelsTopLeft,
    Shredder,
    type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlanning } from "@/lib/api/aurion";
import { saveToStorage } from "@/lib/utils/storage";
import { useTranslation } from "react-i18next";
import { Lesson } from "@/types/aurion";

type WelcomeSection = {
    title: string;
    description: string;
    icon: LucideIcon;
    variant?: "default" | "destructive";
};

const FIRST_LAUNCH_KEY = "firstLaunch";

const WELCOME_SECTIONS: WelcomeSection[] = [
    {
        title: "Salut !",
        description:
            "On a remarqué que c'était ta première fois sur l'application. On te propose de t'expliquer comment ça marche et comment t'y retrouver.",
        icon: Hand,
    },
    {
        title: "Mauria ne remplace pas Aurion !",
        description:
            "Mauria est un outil complémentaire à Aurion : il ne remplace ni le site, ni ses données.",
        icon: CircleAlert,
        variant: "destructive",
    },
    {
        title: "La rapide présentation",
        description:
            "L'application est divisé en plusieurs onglets. Tu peux les retrouver en bas de l'écran. Il y a aussi un menu en haut à droite avec des options supplémentaires.",
        icon: PanelsTopLeft,
    },
    {
        title: "Confidentialité au max !",
        description:
            "L'application n'enregistre rien sur ses serveurs, tout est stocké sur ton téléphone. De ce fait, tu peux l'utiliser sans connexion internet !",
        icon: Shredder,
    },
    {
        title: "Support",
        description:
            "Si tu as des questions, n'hésite pas à nous contacter dans l'onglet \"Support\"",
        icon: MessageCircleQuestion,
    },
];

export function WelcomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        isLoading,
        isFetching,
        data: lessons = [],
    } = useQuery({
        queryKey: ["planning"],
        queryFn: (): Promise<Lesson[]> =>
            fetchPlanning().then((res) => res?.data || lessons),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
    });
    const isBusy = useMemo(
        () => isLoading || isFetching,
        [isLoading, isFetching]
    );
    const [progress, setProgress] = useState(0);

    // Fake progress effect, with irregularities
    useEffect(() => {
        if (!isBusy) {
            setProgress(100);
            const resetTimeout = window.setTimeout(() => setProgress(0), 300);
            return () => window.clearTimeout(resetTimeout);
        }

        setProgress(0);
        const start = Date.now();
        let current = 0;
        const interval = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const base = Math.min(1, elapsed / 7000);
            const burst = Math.random() < 0.25 ? Math.random() * 0.12 : 0;
            const wobble = (Math.random() - 0.5) * 0.05;
            const target = Math.min(1, base + wobble + burst);
            const next = Math.max(current + 0.01, target, base);
            current = next;
            setProgress(Math.round(current * 100));
        }, 140);

        return () => window.clearInterval(interval);
    }, [isBusy]);

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
        <div className="min-h-screen bg-mauria-bg flex flex-col">
            <div className="px-6 pt-16 pb-6 text-center space-y-3">
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-primary">
                    {t("welcome.mauria")}
                </span>
                <h1 className="text-3xl font-bold">{t("welcome.welcome")}</h1>
                <p className="text-sm text-muted-foreground">
                    {t("welcome.getStarted")}
                </p>
            </div>
            <div className="flex-1 px-6 pb-8 space-y-4">
                {WELCOME_SECTIONS.map(
                    ({ title, description, icon: Icon, variant }) => (
                        <Alert
                            key={title}
                            variant={
                                variant === "destructive"
                                    ? "destructive"
                                    : undefined
                            }
                            className="w-full"
                        >
                            <Icon className="h-4 w-4" />
                            <AlertTitle>{title}</AlertTitle>
                            <AlertDescription>{description}</AlertDescription>
                        </Alert>
                    )
                )}
            </div>
            <div className="px-6 pb-10 flex justify-center">
                <Button
                    size="lg"
                    disabled={isBusy}
                    className="relative overflow-hidden"
                    onClick={() => {
                        if (isBusy) return;
                        navigate("/");
                    }}
                >
                    <span className={isBusy ? "opacity-80" : undefined}>
                        {isBusy
                            ? "Chargement des données en cours..."
                            : "C'est parti !"}
                    </span>
                    {isBusy ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-primary-foreground/35 z-10">
                            <div
                                className="h-full bg-mauria-accent transition-[width] duration-200 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    ) : null}
                </Button>
            </div>
        </div>
    );
}
