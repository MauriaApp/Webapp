"use client";

import {
    Home,
    Calendar,
    GraduationCap,
    User,
    ListChecksIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useNavigate, useLocation } from "react-router";

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    const items = [
        {
            id: "home",
            icon: Home,
            path: "/",
            label: "Accueil",
        },
        {
            id: "calendar",
            icon: Calendar,
            path: "/planning",
            label: "Planning",
        },
        {
            id: "education",
            icon: GraduationCap,
            path: "/grades",
            label: "Notes",
        },
        { id: "profile", icon: User, path: "/absences", label: "Absences" },
        {
            id: "agenda",
            icon: ListChecksIcon,
            path: "/agenda",
            label: "Agenda",
        },
    ];

    const getActive = () => {
        if (pathname === "/") return "home";
        if (pathname === "/planning") return "calendar";
        if (pathname === "/grades") return "education";
        if (pathname === "/absences") return "profile";
        if (pathname === "/agenda") return "agenda";
        return "home";
    };

    const active = getActive();

    return (
        <div className="fixed z-20 bottom-0 left-0 right-0 bg-mauria-bg dark:bg-mauria-purple flex w-full justify-between pb-safe pt-0 border-t border-mauria-border">
            {items.map((item) => {
                const isActive = active === item.id;

                return (
                    <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                            "group flex h-auto flex-1 flex-col items-center gap-1 rounded-full px-4 pb-2 pt-2 text-[0.7rem] font-medium transition-colors hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:size-7 min-w-0",
                            isActive
                                ? "text-mauria-purple dark:text-white"
                                : "text-gray-400 dark:text-gray-500 group-hover:text-mauria-purple dark:group-hover:text-white"
                        )}
                        onClick={() => navigate(item.path)}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <span className="relative flex items-center justify-center px-4 py-1">
                            <span
                                className={cn(
                                    "absolute inset-0 rounded-full transition-colors duration-200",
                                    isActive
                                        ? "bg-mauria-purple/10 dark:bg-white/10"
                                        : "bg-transparent group-hover:bg-mauria-purple/10 dark:group-hover:bg-white/10"
                                )}
                            />
                            <item.icon className="relative z-10" />
                        </span>
                        <span className="leading-none text-inherit">
                            {item.label}
                        </span>
                    </Button>
                );
            })}
        </div>
    );
}
