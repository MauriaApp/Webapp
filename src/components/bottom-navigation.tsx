"use client"

import { Home, Calendar, GraduationCap, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router";


export default function BottomNavigation() {
  const navigate = useNavigate()
  const pathname = window.location.pathname

  const items = [
    { id: "home", icon: Home, path: "/" },
    { id: "calendar", icon: Calendar, path: "/planning" },
    { id: "education", icon: GraduationCap, path: "/notes" },
    { id: "profile", icon: User, path: "/absences" },
    { id: "menu", icon: Menu, path: "/menu" },
  ]

  const getActive = () => {
    if (pathname === "/") return "home"
    if (pathname === "/planning") return "calendar"
    if (pathname === "/notes") return "education"
    if (pathname === "/absences") return "profile"
    if (pathname === "/menu") return "menu"
    return "home"
  }

  const active = getActive()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-mauria-dark-bg border-t border-gray-200 dark:border-mauria-dark-border flex justify-around py-2">
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full h-12 w-12 flex items-center justify-center",
            active === item.id ? "text-mauria-light-purple dark:text-white" : "text-gray-400 dark:text-gray-500",
          )}
          onClick={() => navigate(item.path)}
        >
          <item.icon className="h-6 w-6" />
        </Button>
      ))}
    </div>
  )
}

