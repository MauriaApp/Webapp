import { useMemo, type ComponentType } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lightbulb, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AndroidLogo, AppleLogo } from "@/components/platform-logos";
import { ROADMAP_FEATURES } from "@/lib/data/roadmap";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { CONTACT_URL } from "@/lib/utils/contact";
import type { RoadmapPlatform, RoadmapStatus } from "@/types/roadmap";

// Sections are rendered in this order; features keep the order of the data.
const STATUS_ORDER: RoadmapStatus[] = ["inProgress", "pending"];

// Every feature shows all three icons; the platforms it does not touch are
// dimmed, so the row keeps the same width from one card to the next.
const PLATFORM_ORDER: RoadmapPlatform[] = ["web", "ios", "android"];

const PLATFORM_ICONS: Record<
    RoadmapPlatform,
    ComponentType<{ className?: string }>
> = {
    web: Monitor,
    ios: AppleLogo,
    android: AndroidLogo,
};

export function RoadmapPage() {
    const { t } = useTranslation();

    const sections = useMemo(
        () =>
            STATUS_ORDER.map((status) => ({
                status,
                features: ROADMAP_FEATURES.filter(
                    (feature) => feature.status === status
                ),
            })).filter((section) => section.features.length > 0),
        []
    );

    return (
        <motion.div
            variants={staggerGroup}
            initial="hidden"
            animate="show"
            className="space-y-6 pt-4 pb-4"
        >
            <motion.div variants={fadeIn} className="space-y-1">
                <h1 className="text-2xl font-bold text-mauria-purple dark:text-white">
                    {t("roadmapPage.title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t("roadmapPage.subtitle")}
                </p>
            </motion.div>

            {sections.map((section) => (
                <motion.section
                    key={section.status}
                    variants={fadeIn}
                    className="space-y-3"
                >
                    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(`roadmapPage.status.${section.status}`)}
                        <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] font-semibold"
                        >
                            {section.features.length}
                        </Badge>
                    </h2>

                    {section.features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <Card
                                key={feature.id}
                                className="border-none bg-white shadow-md dark:bg-mauria-card overflow-hidden"
                            >
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-start gap-2">
                                            <p className="flex-1 text-sm font-medium text-balance">
                                                {t(
                                                    `roadmapPage.features.${feature.id}.title`
                                                )}
                                            </p>
                                            <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-muted-foreground">
                                                {PLATFORM_ORDER.map(
                                                    (platform) => {
                                                        const PlatformIcon =
                                                            PLATFORM_ICONS[
                                                                platform
                                                            ];

                                                        if (
                                                            !feature.platforms.includes(
                                                                platform
                                                            )
                                                        ) {
                                                            return (
                                                                <span
                                                                    key={
                                                                        platform
                                                                    }
                                                                    className="flex items-center opacity-25"
                                                                    aria-hidden
                                                                >
                                                                    <PlatformIcon className="size-4" />
                                                                </span>
                                                            );
                                                        }

                                                        const label = t(
                                                            `roadmapPage.platforms.${platform}`
                                                        );
                                                        return (
                                                            <span
                                                                key={platform}
                                                                className="flex items-center"
                                                                title={label}
                                                            >
                                                                <PlatformIcon className="size-4" />
                                                                <span className="sr-only">
                                                                    {label}
                                                                </span>
                                                            </span>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                `roadmapPage.features.${feature.id}.description`
                                            )}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </motion.section>
            ))}

            <motion.div variants={fadeIn}>
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(CONTACT_URL, "_blank")}
                >
                    <Lightbulb className="size-4" />
                    {t("roadmapPage.propose")}
                </Button>
            </motion.div>
        </motion.div>
    );
}
