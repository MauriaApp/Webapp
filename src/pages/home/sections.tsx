import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PreparedLesson } from "@/types/home";
import { MessageEntry } from "@/types/data";
import { motion, Variants } from "framer-motion";
import { Clock, Info, MapPin, SquareArrowOutDownRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatLessonLocation, formatLessonType } from "@/lib/utils/home";
import { useTranslation } from "react-i18next";

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
        className="mb-4 text-2xl font-bold text-mauria-purple dark:text-white"
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
        className="mb-4 border-none bg-white p-4 shadow-md dark:bg-mauria-card"
        variants={itemVariants}
        onClick={onClick(lesson)}
    >
        <div className="space-y-2">
            <div className="flex items-start justify-between">
                <h4 className="font-semibold text-balance leading-tight pr-2">
                    {lesson.courseTitle}
                </h4>
                <Badge
                    className={`px-2 py-1 rounded-md text-xs font-medium bg-mauria-accent/20 text-mauria-accent whitespace-nowrap`}
                >
                    {formatLessonType(lesson.type)}
                </Badge>
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] text-sm text-muted-foreground ">
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{lesson.time}</span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                    <MapPin className="h-4 w-4" />
                    <span>{formatLessonLocation(lesson.location)}</span>
                </div>
                <div className="mb-0 flex items-center justify-end">
                    <SquareArrowOutDownRightIcon className="text-muted-foreground/50 h-3 w-3" />
                </div>
            </div>
        </div>
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
        className="mb-8"
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
export const EmptyState = () => {
    const { t } = useTranslation();

    return (
        <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
    >
        <SectionHeader title={t("homePage.nextClasses")} />
        <motion.div variants={itemVariants}>
            <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>
                    {t("homePage.nextClassesEmptyState")}
                </AlertTitle>
            </Alert>
        </motion.div>
    </motion.section>
    );
};

// Welcome Header Component
export const WelcomeHeader = ({ firstName }: { firstName: string }) => {
    const { t } = useTranslation();

    return (
        <motion.h2
            className="mt-4 mb-6 text-3xl font-bold text-mauria-purple dark:text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
        >
            {t("homePage.title")} {firstName} !
        </motion.h2>
    );
};

// Important Message Component
export const ImportantMessage = ({ message }: { message?: MessageEntry }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        className="bg-white rounded-lg"
    >
        <Alert className="mb-8 border-none bg-mauria-accent/20 dark:bg-mauria-alert">
            <AlertTitle className="font-bold text-mauria-accent dark:text-white">
                {message?.title ?? "Aucun message important"}
            </AlertTitle>
            <AlertDescription className="text-mauria-accent/90 dark:text-white/90">
                {message?.message ?? "Bonne journée !"}
            </AlertDescription>
        </Alert>
    </motion.div>
);
