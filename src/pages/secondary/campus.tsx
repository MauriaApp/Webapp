import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { CAMPUS_OPTIONS, setCampus, type Campus } from "@/lib/utils/campus";
import {
    PREFETCH_KEYS,
    clearPrefetchStarts,
} from "@/lib/hooks/use-welcome-prefetch";
import { fadeIn } from "@/lib/motion";

// Gentle cascade for the campus buttons, same feel as the welcome screen.
const campusStagger = {
    hidden: {},
    show: { transition: { delayChildren: 0.15, staggerChildren: 0.15 } },
};

export function CampusPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const handleSelect = (campus: Campus) => {
        setCampus(campus);
        // Background prefetch already done (success or error): straight to
        // the home page. Otherwise, the preparation page takes over and
        // waits for the remaining queries.
        const settled = (key: string) => {
            const state = queryClient.getQueryState([key]);
            return state != null && state.status !== "pending";
        };
        if (PREFETCH_KEYS.every(settled)) {
            clearPrefetchStarts();
            navigate("/");
        } else {
            navigate("/preparing");
        }
    };

    return (
        <PageTransition className="min-h-screen bg-mauria-bg flex flex-col">
            <motion.div
                className="flex-1 flex flex-col gap-4 px-6 pt-16"
                variants={campusStagger}
                initial="hidden"
                animate="show"
            >
                <motion.div
                    variants={fadeIn}
                    className="pb-4 text-center space-y-3"
                >
                    <h1 className="text-3xl font-bold">
                        {t("campusPage.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("campusPage.subtitle")}
                    </p>
                </motion.div>
                {CAMPUS_OPTIONS.map((campus) => (
                    <motion.div key={campus} variants={fadeIn}>
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => handleSelect(campus)}
                        >
                            {t(`sidebar.campusParameter.${campus}`)}
                        </Button>
                    </motion.div>
                ))}
            </motion.div>
        </PageTransition>
    );
}
