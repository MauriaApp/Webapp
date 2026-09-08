import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Apple,
    Beef,
    CakeSlice,
    Carrot,
    CookingPot,
    CupSoda,
    Drumstick,
    ExternalLink,
    Fish,
    Globe,
    LucideIcon,
    Salad,
    Sandwich,
    Soup,
    Utensils,
    UtensilsCrossed,
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
import { SectionHeader } from "./sections";
import { fadeIn, staggerGroup } from "@/lib/motion";

const containerVariants = staggerGroup;
const itemVariants = fadeIn;

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

// Icône par type de section du menu (entrées, plat, dessert…).
const SECTION_ICON_KEYWORDS: Array<[string, LucideIcon]> = [
    ["salade", Salad],
    ["crudite", Salad],
    ["soupe", Soup],
    ["potage", Soup],
    ["veloute", Soup],
    ["entree", Salad],
    ["poisson", Fish],
    ["grill", Beef],
    ["viande", Beef],
    ["pizza", CookingPot],
    ["pates", CookingPot],
    ["plat", Beef],
    ["garniture", Carrot],
    ["accompagn", Carrot],
    ["legume", Carrot],
    ["feculent", Carrot],
    ["sandwich", Sandwich],
    ["burger", Sandwich],
    ["dessert", CakeSlice],
    ["patisserie", CakeSlice],
    ["gateau", CakeSlice],
    ["fromage", CakeSlice],
    ["laitage", CakeSlice],
    ["yaourt", CakeSlice],
    ["fruit", Apple],
    ["compote", Apple],
    ["boisson", CupSoda],
    ["pain", Wheat],
];

const normalizeTitle = (s: string) =>
    s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

function getSectionIcon(title: string): LucideIcon {
    const normalized = normalizeTitle(title);
    for (const [keyword, Icon] of SECTION_ICON_KEYWORDS) {
        if (normalized.includes(keyword)) return Icon;
    }
    return UtensilsCrossed;
}

export function RestaurantsSection() {
    const { t } = useTranslation();
    const { data } = useQuery({
        queryKey: ["dailyMenu"],
        queryFn: fetchDailyMenu,
        staleTime: 1000 * 60 * 30, // 30 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        placeholderData: (previousData) => previousData,
    });

    const [selected, setSelected] = useState<RestaurantMenu | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // API pas encore à jour / injoignable : on n'affiche simplement rien.
    if (!data) return null;

    const handleClick = (restaurant: RestaurantMenu) => {
        setSelected(restaurant);
        setIsDrawerOpen(true);
    };

    return (
        <motion.section className="mb-8" variants={containerVariants}>
            <SectionHeader title={t("homePage.restaurants.title")} />

            <motion.div
                variants={itemVariants}
                className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]"
            >
                {data.restaurants.map((restaurant) => {
                    const Icon = RESTAURANT_ICONS[restaurant.id] ?? Utensils;
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
                        <div className="w-full px-4 pb-6 sm:px-6">
                            <DrawerHeader className="px-0 text-left">
                                <DrawerTitle className="text-2xl font-semibold text-foreground">
                                    {selected.name}
                                </DrawerTitle>
                                {data.date && (
                                    <DrawerDescription className="first-letter:uppercase">
                                        {t("homePage.restaurants.menuOf", {
                                            date: data.date,
                                        })}
                                    </DrawerDescription>
                                )}
                            </DrawerHeader>

                            <div className="grid max-h-[60vh] grid-cols-1 gap-x-6 gap-y-5 overflow-y-auto pb-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                                {selected.sections.length === 0 && (
                                    <p className="col-span-full text-muted-foreground">
                                        {t("homePage.restaurants.unavailable")}
                                    </p>
                                )}
                                {selected.sections.map((section) => {
                                    const SectionIcon = getSectionIcon(
                                        section.title
                                    );
                                    return (
                                        <div key={section.title}>
                                            <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-mauria-purple dark:text-mauria-accent">
                                                <SectionIcon className="h-4 w-4 shrink-0" />
                                                {section.title}
                                            </h3>
                                            <ul className="space-y-1">
                                                {section.items.map(
                                                    (item, i) => (
                                                        <li
                                                            key={`${section.title}-${i}`}
                                                            className="text-sm text-foreground"
                                                        >
                                                            {item}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    );
                                })}
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
