import { motion, Variants } from "framer-motion";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import RootLayout from "@/pages/layout";

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
  const upcomingCourses = [
    {
      title: "Développement Web",
      time: "08:00 - 10:00",
      location: "ISEN C402 - Amphi Prépa",
      type: "COURS_TD",
    },
    {
      title: "Physique des Ondes",
      time: "10:20 - 12:20",
      location: "ISEN C953 - Salle de TP",
      type: "COURS_TD",
    },
    {
      title: "Mathématiques 7: Mathématiques Discrètes",
      time: "15:30",
      location: "ISEN B804 (H)",
      type: "COURS_TD",
    },
  ];

  return (
    <RootLayout>
      <motion.h2
        className="mt-4 mb-6 text-3xl font-bold text-mauria-light-purple dark:text-white"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        Hello Mauria !
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      >
        <Alert className="mb-8 border-none bg-[#FFE5D9] dark:bg-mauria-dark-alert">
          <AlertTitle className="font-bold text-mauria-light-accent dark:text-white">
            Message Important !
          </AlertTitle>
          <AlertDescription className="text-mauria-light-accent/90 dark:text-white/90">
            Bienvenue sur Mauria ! N'hésitez pas à l'installer, ça va être ton meilleur ami!
          </AlertDescription>
        </Alert>
      </motion.div>

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
          À venir demain
        </motion.h2>

        {upcomingCourses.map(({ title, time, location, type }) => (
          <MotionCard
            key={title}
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
            <div className="mt-1 text-xs text-gray-400">{type}</div>
          </MotionCard>
        ))}
      </motion.section>
    </RootLayout>
  );
}
