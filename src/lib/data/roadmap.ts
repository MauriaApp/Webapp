import {
    Bell,
    Bug,
    CalendarClock,
    CalendarSync,
    Gauge,
    Smartphone,
    Vibrate,
    WifiOff,
    Wrench,
} from "lucide-react";

import type { RoadmapFeature } from "@/types/roadmap";

/**
 * Roadmap, hardcoded until features have an API endpoint. Most entries come
 * from student reports sent to the support address. Each section is rendered
 * in the order below; `platforms` drives the icons shown next to the title.
 */
export const ROADMAP_FEATURES: RoadmapFeature[] = [
    {
        id: "iosDevSetup",
        status: "inProgress",
        platforms: ["ios"],
        icon: Wrench,
    },
    {
        id: "flashbang",
        status: "pending",
        platforms: ["ios"],
        icon: Bug,
    },
    {
        id: "calendarSync",
        status: "pending",
        platforms: ["ios", "android"],
        icon: CalendarSync,
    },
    {
        id: "offline",
        status: "pending",
        platforms: ["web", "ios", "android"],
        icon: WifiOff,
    },
    {
        id: "gradeNotifications",
        status: "pending",
        platforms: ["ios", "android"],
        icon: Bell,
    },
    {
        id: "agendaNotifications",
        status: "pending",
        platforms: ["ios", "android"],
        icon: CalendarClock,
    },
    {
        id: "iosWidget",
        status: "pending",
        platforms: ["ios"],
        icon: Smartphone,
    },
    {
        id: "haptics",
        status: "pending",
        platforms: ["ios", "android"],
        icon: Vibrate,
    },
    {
        id: "generalOptimizations",
        status: "pending",
        platforms: ["web", "ios", "android"],
        icon: Gauge,
    },
];
