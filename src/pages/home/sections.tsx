import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PreparedLesson } from "@/types/home";
import { MessageEntry } from "@/types/data";
import { JuniaStatus } from "@/lib/api/junia-status";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    Clock,
    Info,
    MapPin,
    ServerCrash,
    SquareArrowOutDownRightIcon,
    WifiOff,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    formatElapsed,
    formatLessonLocation,
    formatLessonType,
} from "@/lib/utils/home";
import { useTranslation } from "react-i18next";
import { EASE, fadeIn, staggerGroup } from "@/lib/motion";

const MotionCard = motion(Card);
const MotionAlert = motion(Alert);

const containerVariants = staggerGroup;
const itemVariants = fadeIn;
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
        className="mb-4 cursor-pointer border-none bg-white p-4 shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card"
        variants={itemVariants}
        onClick={onClick(lesson)}
    >
        <div className="space-y-2">
            <div className="flex items-start justify-between">
                <h4 className="font-semibold text-balance leading-tight pr-2">
                    {lesson.courseTitle}
                </h4>
                <Badge className="px-2 py-1 rounded-md text-xs font-medium bg-mauria-accent/20 text-black dark:text-white whitespace-nowrap">
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
    <motion.section className="mb-8" variants={containerVariants}>
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
        <motion.section className="mb-8" variants={containerVariants}>
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
            variants={fadeIn}
        >
            {t("homePage.title")} {firstName} !
        </motion.h2>
    );
};

// Important Message Component
// How long a message stays on screen before the carousel moves to the next.
const MESSAGE_DURATION = 8; // seconds

export const ImportantMessage = ({
    messages = [],
}: {
    messages?: MessageEntry[];
}) => {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    // Tapping a segment pins that message and stops the rotation.
    const [autoplay, setAutoplay] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | null>(null);

    // AnimatePresence swaps the message from its own render pass, so a `layout`
    // prop on the Alert never re-measures it and the height snaps. Watch the
    // content instead and animate the wrapper height ourselves.
    useEffect(() => {
        const node = contentRef.current;
        if (!node) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) setContentHeight(entry.contentRect.height);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const count = messages.length;

    // The list can shrink between refetches — never point past its end.
    useEffect(() => {
        if (index > 0 && index > count - 1) {
            setIndex(0);
        }
    }, [count, index]);

    const current = messages[Math.min(index, Math.max(count - 1, 0))];
    const goTo = (target: number) => {
        setIndex(target);
        setAutoplay(false);
    };
    const next = () => setIndex((i) => (i + 1) % count);

    return (
        <motion.div
            variants={fadeIn}
            className="mb-8 rounded-lg bg-white dark:bg-mauria-alert oled:bg-black"
        >
            <MotionAlert className="overflow-hidden border-none bg-mauria-accent/20 dark:bg-mauria-alert">
                {/* mode="wait" so the box only resizes once the old text is
                    gone — the height then eases to the new one. */}
                <motion.div
                    className="overflow-hidden"
                    initial={false}
                    animate={{ height: contentHeight ?? "auto" }}
                    transition={{ duration: 0.35, ease: EASE }}
                >
                    <div ref={contentRef}>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: EASE }}
                            >
                                <AlertTitle className="font-bold text-black dark:text-white">
                                    {current?.title ||
                                        t("homePage.noImportantMessageTitle")}
                                </AlertTitle>
                                <AlertDescription className="text-black/80 dark:text-white/90">
                                    {current?.message ||
                                        t("homePage.noImportantMessageBody")}
                                </AlertDescription>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {count > 1 && (
                    <div className="-mx-2 -mb-2 mt-3 flex items-center gap-1.5">
                        {messages.map((entry, i) => (
                            <button
                                key={`${i}-${entry.title}`}
                                type="button"
                                aria-label={t("homePage.goToMessage", {
                                    index: i + 1,
                                })}
                                aria-current={i === index}
                                onClick={() => goTo(i)}
                                className="group flex h-3 flex-1 cursor-pointer items-center"
                            >
                                <span className="block h-1 w-full overflow-hidden rounded-full bg-black/15 dark:bg-white/20">
                                    <motion.span
                                        key={`${i}-${index}-${String(autoplay)}`}
                                        className="block h-full origin-left rounded-full bg-mauria-purple dark:bg-white"
                                        initial={{
                                            scaleX:
                                                i < index ||
                                                (i === index && !autoplay)
                                                    ? 1
                                                    : 0,
                                        }}
                                        animate={{
                                            scaleX: i <= index ? 1 : 0,
                                        }}
                                        transition={
                                            i === index && autoplay
                                                ? {
                                                      duration:
                                                          MESSAGE_DURATION,
                                                      ease: "linear",
                                                  }
                                                : { duration: 0 }
                                        }
                                        onAnimationComplete={() => {
                                            if (i === index && autoplay) {
                                                next();
                                            }
                                        }}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </MotionAlert>
        </motion.div>
    );
};

// Junia Status Warning Component
const JuniaWarning = ({
    Icon,
    title,
    body,
    since,
}: {
    Icon: LucideIcon;
    title: string;
    body: string;
    since: string | null;
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            variants={fadeIn}
            className="rounded-lg bg-white dark:bg-mauria-alert oled:bg-black"
        >
            <Alert className="border-none bg-amber-500/20 dark:bg-amber-500/15">
                <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((v) => !v)}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-foreground" />
                        <AlertTitle className="mb-0 font-bold text-black dark:text-white">
                            {title}
                        </AlertTitle>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 shrink-0 text-black/60 transition-transform duration-200 dark:text-white/60 ${expanded ? "rotate-180" : ""}`}
                    />
                </button>
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="overflow-hidden"
                        >
                            <AlertDescription className="pt-2 pl-6 text-black/80 dark:text-white/90">
                                {body}
                                {since && (
                                    <span className="mt-1 block font-medium">
                                        {t("homePage.downSince", {
                                            duration: formatElapsed(since),
                                        })}
                                    </span>
                                )}
                            </AlertDescription>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Alert>
        </motion.div>
    );
};

export const JuniaStatusWarning = ({
    status,
}: {
    status?: JuniaStatus | null;
}) => {
    const { t } = useTranslation();

    const warnings = [
        status?.aurionDown && {
            key: "aurion",
            Icon: ServerCrash,
            title: t("homePage.aurionDownTitle"),
            body: t("homePage.aurionDownBody"),
            since: status.aurionSince,
        },
        status?.wifiDown && {
            key: "wifi",
            Icon: WifiOff,
            title: t("homePage.wifiDownTitle"),
            body: t("homePage.wifiDownBody"),
            since: status.wifiSince,
        },
    ].filter((warning) => !!warning);

    if (warnings.length === 0) return null;

    // -mt-4 pulls the warnings closer to the important message, whose Alert
    // already ends with mb-8.
    return (
        <div className="-mt-4 mb-8 space-y-4">
            {warnings.map(({ key, ...warning }) => (
                <JuniaWarning key={key} {...warning} />
            ))}
        </div>
    );
};
