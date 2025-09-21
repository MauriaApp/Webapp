import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { getHomeUpcoming } from "@/utils/home";
import { getFirstName, fetchImportantMessage } from "@/utils/api";
import type { MessageEntry } from "@/utils/api";
import { Info } from "lucide-react";

const MotionCard = motion(Card);

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            delayChildren: 0.05,
            staggerChildren: 0.08,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.35,
            ease: "easeOut",
        },
    },
};

export default function Home() {
    const { current, today, tomorrow } = getHomeUpcoming(true);
    const firstName = getFirstName() || "et bienvenu sur Mauria";
    const [importantMessage, setImportantMessage] =
        useState<MessageEntry | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const msg = await fetchImportantMessage();
                if (mounted) setImportantMessage(msg);
            } catch {
                if (mounted)
                    setImportantMessage({
                        title: "Erreur",
                        message:
                            "Une erreur est survenue, rechargez la page plus tard",
                    });
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <>
            {/* Welcome headline */}{" "}
            <motion.h2
                className="mt-4 mb-6 text-3xl font-bold text-mauria-light-purple dark:text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                Hello {firstName} !
            </motion.h2>
            {/* Announcement / important message */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            >
                <Alert className="mb-8 border-none bg-[#FFE5D9] dark:bg-mauria-dark-alert">
                    <AlertTitle className="font-bold text-mauria-light-accent dark:text-white">
                        {importantMessage?.title ?? "Aucun message important"}
                    </AlertTitle>
                    <AlertDescription className="text-mauria-light-accent/90 dark:text-white/90">
                        {importantMessage?.message ?? "Bonne journée !"}
                    </AlertDescription>
                </Alert>
            </motion.div>
            {/* Current lesson */}
            {current && (
                <motion.section
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.h2
                        className="mb-4 text-2xl font-bold text-mauria-light-purple dark:text-white"
                        variants={itemVariants}
                    >
                        En cours
                    </motion.h2>
                    <MotionCard
                        key={`${current.title}-${current.time}-current`}
                        className="mb-4 border-none bg-white p-4 shadow-md dark:bg-mauria-dark-card"
                        variants={itemVariants}
                    >
                        <h3 className="text-lg font-bold text-mauria-light-purple dark:text-white">
                            {current.title}
                        </h3>
                        <div className="mt-1 flex items-center text-gray-600 dark:text-gray-300">
                            <span>{current.time}</span>
                            <span className="mx-2">—</span>
                            <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                                {current.location}
                            </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                            {current.type}
                        </div>
                    </MotionCard>
                </motion.section>
            )}
            {/* Today's remaining lessons */}
            {today.length > 0 && (
                <motion.section
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.h2
                        className="mb-4 text-2xl font-bold text-mauria-light-purple dark:text-white"
                        variants={itemVariants}
                    >
                        Aujourd'hui
                    </motion.h2>
                    {today.map(({ title, time, location, type }) => (
                        <MotionCard
                            key={`${title}-${time}-today`}
                            className="mb-4 border-none bg-white p-4 shadow-md dark:bg-mauria-dark-card"
                            variants={itemVariants}
                        >
                            <h3 className="text-lg font-bold text-mauria-light-purple dark:text-white">
                                {title}
                            </h3>
                            <div className="mt-1 flex items-center text-gray-600 dark:text-gray-300">
                                <span>{time}</span>
                                <span className="mx-2">—</span>
                                <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                                    {location}
                                </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                                {type}
                            </div>
                        </MotionCard>
                    ))}
                </motion.section>
            )}
            {/* Tomorrow's lessons (only if no current and none left today) */}
            {!current && today.length === 0 && tomorrow.length > 0 && (
                <motion.section
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.h2
                        className="mb-4 text-2xl font-bold text-mauria-light-purple dark:text-white"
                        variants={itemVariants}
                    >
                        Demain
                    </motion.h2>
                    {tomorrow.map(({ title, time, location, type }) => (
                        <MotionCard
                            key={`${title}-${time}-tomorrow`}
                            className="mb-4 border-none bg-white p-4 shadow-md dark:bg-mauria-dark-card"
                            variants={itemVariants}
                        >
                            <h3 className="text-lg font-bold text-mauria-light-purple dark:text-white">
                                {title}
                            </h3>
                            <div className="mt-1 flex items-center text-gray-600 dark:text-gray-300">
                                <span>{time}</span>
                                <span className="mx-2">—</span>
                                <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                                    {location}
                                </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                                {type}
                            </div>
                        </MotionCard>
                    ))}
                </motion.section>
            )}
            {/* Empty state: nothing current, today, or tomorrow */}
            {!current && today.length === 0 && tomorrow.length === 0 && (
                <motion.section
                    className="mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.h2
                        className="mb-4 text-2xl font-bold text-mauria-light-purple dark:text-white"
                        variants={itemVariants}
                    >
                        À venir
                    </motion.h2>
                    <motion.div variants={itemVariants}>
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertTitle>
                                Rien à venir pour aujourd'hui ni demain, profite
                                bien de ton repos et de ton temps libre !
                            </AlertTitle>
                        </Alert>
                    </motion.div>
                </motion.section>
            )}
        </>
    );
}
