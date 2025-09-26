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
        { id: "home", icon: Home, path: "/" },
        { id: "calendar", icon: Calendar, path: "/planning" },
        { id: "education", icon: GraduationCap, path: "/grades" },
        { id: "profile", icon: User, path: "/absences" },
        { id: "agenda", icon: ListChecksIcon, path: "/agenda" },
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
        <div className="fixed z-20 bottom-0 left-0 right-0 bg-mauria-bg dark:bg-mauria-purple flex justify-around py-2 border-t border-mauria-border">
            {items.map((item) => (
                <Button
                    key={item.id}
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-full h-12 w-12 flex items-center justify-center [&_svg]:size-9!",
                        active === item.id
                            ? "text-mauria-purple dark:text-white"
                            : "text-gray-400 dark:text-gray-500"
                    )}
                    onClick={() => navigate(item.path)}
                >
                    <item.icon className="h-6 w-6" />
                </Button>
            ))}
        </div>
    );
}
