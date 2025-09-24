import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PreparedLesson } from "@/types/home";
import { MessageEntry } from "@/types/data";
import { motion, Variants } from "framer-motion";
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
// Section Header Component
export const SectionHeader = ({ title }: { title: string }) => (
    <motion.h2
        className="mb-4 text-2xl font-bold text-mauria-light-purple dark:text-white"
        variants={itemVariants}
    >
        {title}
    </motion.h2>
);

// Lesson Card Component
export const LessonCard = ({
    lesson,
    keyPrefix,
    onClick,
}: {
    lesson: PreparedLesson;
    keyPrefix: string;
    onClick: (lesson: PreparedLesson) => () => void;
}) => (
    <MotionCard
        key={`${lesson.courseTitle}-${lesson.time}-${keyPrefix}`}
        className="mb-4 border-none bg-white p-4 shadow-md dark:bg-mauria-dark-card"
        variants={itemVariants}
        onClick={onClick(lesson)}
    >
        <h3 className="text-lg font-bold text-mauria-light-purple dark:text-white">
            {lesson.courseTitle}
        </h3>
        <div className="mt-1 flex items-center text-gray-600 dark:text-gray-300">
            <span>{lesson.time}</span>
            <span className="mx-2">—</span>
            <span className="text-mauria-light-accent dark:text-mauria-dark-accent">
                {lesson.location}
            </span>
        </div>
        <div className="mt-1 text-xs text-gray-400">{lesson.type}</div>
    </MotionCard>
);

// Lessons Section Component
export const LessonsSection = ({
    title,
    lessons,
    keyPrefix,
    onClick,
}: {
    title: string;
    lessons: PreparedLesson[];
    keyPrefix: string;
    onClick: (lesson: PreparedLesson) => () => void;
}) => (
    <motion.section
        className="mb-8 mx-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
    >
        <SectionHeader title={title} />
        {lessons.map((lesson) => (
            <LessonCard
                key={`${lesson.courseTitle}-${lesson.time}`}
                lesson={lesson}
                keyPrefix={keyPrefix}
                onClick={onClick}
            />
        ))}
    </motion.section>
);

// Empty State Component
export const EmptyState = () => (
    <motion.section
        className="mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
    >
        <SectionHeader title="À venir" />
        <motion.div variants={itemVariants}>
            <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>
                    Rien à venir pour aujourd'hui ni demain, profite bien de ton
                    repos et de ton temps libre !
                </AlertTitle>
            </Alert>
        </motion.div>
    </motion.section>
);

// Welcome Header Component
export const WelcomeHeader = ({ firstName }: { firstName: string }) => (
    <motion.h2
        className="mt-4 mb-6 text-3xl font-bold text-mauria-light-purple dark:text-white"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
    >
        Hello {firstName} !
    </motion.h2>
);

// Important Message Component
export const ImportantMessage = ({ message }: { message?: MessageEntry }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
    >
        <Alert className="mb-8 border-none bg-[#FFE5D9] dark:bg-mauria-dark-alert">
            <AlertTitle className="font-bold text-mauria-light-accent dark:text-white">
                {message?.title ?? "Aucun message important"}
            </AlertTitle>
            <AlertDescription className="text-mauria-light-accent/90 dark:text-white/90">
                {message?.message ?? "Bonne journée !"}
            </AlertDescription>
        </Alert>
    </motion.div>
);
