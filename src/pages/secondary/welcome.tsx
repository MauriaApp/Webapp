import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    CircleAlert,
    MessageCircleQuestion,
    PanelsTopLeft,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import { fadeIn } from "@/lib/motion";
import { fetchAbsences, fetchGrades, fetchPlanning } from "@/lib/api/aurion";
import { fetchImportantMessage } from "@/lib/api/supa";
import { fetchDailyMenu } from "@/lib/api/lacatho";
import { saveToStorage } from "@/lib/utils/storage";
import { useTranslation } from "react-i18next";
import { Absence, Grade, Lesson } from "@/types/aurion";

type WelcomeSection = {
    key: string;
    icon: LucideIcon;
    variant?: "default" | "destructive";
};

const FIRST_LAUNCH_KEY = "firstLaunch";

const PREFETCH_OPTS = {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: 1,
} as const;

async function timedFetch<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    console.log(`[prefetch] ${label} — start`);
    try {
        return await fn();
    } finally {
        console.log(
            `[prefetch] ${label} — done in ${Math.round(
                performance.now() - start
            )}ms`
        );
    }
}

// Slow, deliberate cascade for the welcome screen: ~1s between each item.
const welcomeStagger = {
    hidden: {},
    show: { transition: { delayChildren: 0.15, staggerChildren: 1 } },
};

const WELCOME_SECTIONS: WelcomeSection[] = [
    { key: "notAurion", icon: CircleAlert, variant: "destructive" },
    { key: "overview", icon: PanelsTopLeft },
    { key: "privacy", icon: ShieldCheck },
    { key: "support", icon: MessageCircleQuestion },
];

export function WelcomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    // Warm every cache we can while the welcome screen is shown, so the app
    // is ready (planning, grades, absences, home content) once the user enters.
    const results = useQueries({
        queries: [
            {
                queryKey: ["planning"],
                queryFn: (): Promise<Lesson[]> =>
                    timedFetch("planning", async () => {
                        const res = await fetchPlanning();
                        if (!res?.success)
                            throw new Error("Failed to fetch planning");
                        return res.data ?? [];
                    }),
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["grades"],
                queryFn: (): Promise<Grade[]> =>
                    timedFetch("grades", async () => {
                        const res = await fetchGrades();
                        if (!res?.success)
                            throw new Error("Failed to fetch grades");
                        return res.data ?? [];
                    }),
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["absences"],
                queryFn: (): Promise<Absence[]> =>
                    timedFetch("absences", async () => {
                        const res = await fetchAbsences();
                        if (!res?.success)
                            throw new Error("Failed to fetch absences");
                        return res.data ?? [];
                    }),
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["importantMessage"],
                queryFn: () =>
                    timedFetch("importantMessage", fetchImportantMessage),
                ...PREFETCH_OPTS,
            },
            {
                queryKey: ["dailyMenu"],
                queryFn: () => timedFetch("dailyMenu", fetchDailyMenu),
                ...PREFETCH_OPTS,
                staleTime: 1000 * 60 * 30,
            },
        ],
    });

    // Only block the button on the Aurion data (planning, grades, absences).
    const isBusy = results.slice(0, 3).some((r) => r.isLoading);
    const [progress, setProgress] = useState(0);

    const tips = t("welcome.tips", { returnObjects: true }) as string[];
    // A shuffled walk through the tips, picked once, so they show in a
    // random order without repeating back-to-back.
    const [tipOrder] = useState(() => {
        const idx = tips.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        return idx;
    });
    const [tipStep, setTipStep] = useState(0);
    const tipIndex = tipOrder[tipStep % tipOrder.length] ?? 0;

    // Cycle through the loading tips while the data is being fetched.
    useEffect(() => {
        if (!isBusy) return;
        setTipStep(0);
        const id = window.setInterval(() => setTipStep((s) => s + 1), 2800);
        return () => window.clearInterval(id);
    }, [isBusy]);

    // Fake progress effect, with irregularities. Tuned so it rarely pins at
    // 100% before the (slow) Aurion scrapes actually finish.
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
            const base = Math.min(0.97, elapsed / 20000);
            const burst = Math.random() < 0.22 ? Math.random() * 0.1 : 0;
            const wobble = (Math.random() - 0.5) * 0.04;
            const target = Math.min(0.97, base + wobble + burst);
            const next = Math.min(
                0.97,
                Math.max(current + 0.006, target, base)
            );
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
            <motion.div
                className="flex-1 flex flex-col gap-4 px-6 pt-16 pb-8"
                variants={welcomeStagger}
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
            </motion.div>
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="show"
                className="px-6 pb-10 flex flex-col items-center gap-3"
            >
                <p
                    aria-live="polite"
                    className="min-h-[2.5rem] max-w-sm text-center text-sm text-muted-foreground leading-snug flex items-center justify-center"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={isBusy ? tipStep : "idle"}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {isBusy ? tips[tipIndex] : ""}
                        </motion.span>
                    </AnimatePresence>
                </p>
                <Button
                    size="lg"
                    aria-disabled={isBusy}
                    className={`relative w-full overflow-hidden ${
                        isBusy ? "bg-primary/15 hover:bg-primary/15" : ""
                    }`}
                    onClick={() => {
                        if (isBusy) return;
                        navigate("/");
                    }}
                >
                    {isBusy ? (
                        <span
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-0 bg-primary/50 transition-[width] duration-200 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    ) : null}
                    <span className="relative z-10">
                        {isBusy ? t("common.loading") : t("welcome.start")}
                    </span>
                </Button>
            </motion.div>
        </div>
    );
}
