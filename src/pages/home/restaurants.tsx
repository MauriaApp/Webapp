import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, Variants } from "framer-motion";
import {
    Drumstick,
    ExternalLink,
    Globe,
    LucideIcon,
    Salad,
    Sandwich,
    Utensils,
    Wheat,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { fetchDailyMenu } from "@/lib/api/lacatho";
import { RestaurantMenu } from "@/types/data";
import { useRestaurantMenuEnabled } from "@/lib/utils/restaurant-menu";
import { SectionHeader } from "./sections";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { delayChildren: 0.05, staggerChildren: 0.06 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: "easeOut" },
    },
};

// food-corner : fast-food (nuggets, samoussas, frites)
// globe-trotter : cuisine du monde (couscous…)
// green : healthy (purée, poulet, poisson, légumes)
// tradi : pâtes sauce au choix
// sandwicherie : sandwichs / ciabattas
const RESTAURANT_ICONS: Record<string, LucideIcon> = {
    "food-corner": Drumstick,
    "globe-trotter": Globe,
    green: Salad,
    tradi: Wheat,
    sandwicherie: Sandwich,
};

export function RestaurantsSection() {
    const { t } = useTranslation();
    const menuEnabled = useRestaurantMenuEnabled();
    const { data } = useQuery({
        queryKey: ["dailyMenu"],
        queryFn: fetchDailyMenu,
        staleTime: 1000 * 60 * 30, // 30 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        placeholderData: (previousData) => previousData,
    });

    const [selected, setSelected] = useState<RestaurantMenu | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Désactivé depuis les réglages, ou API pas encore à jour / injoignable.
    if (!menuEnabled || !data) return null;

    const handleClick = (restaurant: RestaurantMenu) => {
        setSelected(restaurant);
        setIsDrawerOpen(true);
    };

    return (
        <motion.section
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <SectionHeader title={t("homePage.restaurants.title")} />

            <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
                {data.restaurants.map((restaurant) => {
                    const Icon =
                        RESTAURANT_ICONS[restaurant.id] ?? Utensils;
                    return (
                        <Card
                            key={restaurant.id}
                            onClick={() => handleClick(restaurant)}
                            className="flex cursor-pointer items-center gap-3 border-none bg-white p-4 shadow-md transition-transform duration-150 hover:-translate-y-0.5 dark:bg-mauria-card"
                        >
                            <Icon className="h-5 w-5 shrink-0 text-mauria-purple dark:text-mauria-accent" />
                            <span className="text-sm font-semibold leading-tight text-foreground">
                                {restaurant.name}
                            </span>
                        </Card>
                    );
                })}
            </motion.div>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="bg-card border-border pb-safe">
                    {selected && (
                        <div className="mx-auto w-full max-w-3xl px-4 pb-6 sm:px-6">
                            <DrawerHeader className="px-0 text-left">
                                <DrawerTitle className="text-2xl font-semibold text-foreground">
                                    {selected.name}
                                </DrawerTitle>
                                {data.date && (
                                    <DrawerDescription className="capitalize">
                                        {t("homePage.restaurants.menuOf", {
                                            date: data.date,
                                        })}
                                    </DrawerDescription>
                                )}
                            </DrawerHeader>

                            <div className="max-h-[60vh] space-y-5 overflow-y-auto pb-6 pt-2">
                                {selected.sections.length === 0 && (
                                    <p className="text-muted-foreground">
                                        {t(
                                            "homePage.restaurants.unavailable"
                                        )}
                                    </p>
                                )}
                                {selected.sections.map((section) => (
                                    <div key={section.title}>
                                        <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-mauria-purple dark:text-mauria-accent">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-1">
                                            {section.items.map((item, i) => (
                                                <li
                                                    key={`${section.title}-${i}`}
                                                    className="text-sm text-foreground"
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                asChild
                                className="mt-4 w-full bg-transparent"
                            >
                                <a
                                    href={data.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t("homePage.restaurants.openPdf")}
                                </a>
                            </Button>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </motion.section>
    );
}
