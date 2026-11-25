import type { LucideIcon } from "lucide-react";

export type RoadmapStatus = "inProgress" | "pending";

/** Platforms a feature ships on, shown as icons next to its title. */
export type RoadmapPlatform = "web" | "ios" | "android";

/**
 * A feature on the roadmap page. The label and description live in the
 * locales (`roadmapPage.features.<id>`) so they follow the app language.
 */
export type RoadmapFeature = {
    id: string;
    status: RoadmapStatus;
    platforms: RoadmapPlatform[];
    icon: LucideIcon;
};
