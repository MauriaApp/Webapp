import type React from "react";
// import { MenuIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import FirstLaunchDrawer from "@/components/first-launch-drawer";
import NewUpdateDrawer from "@/components/new-update-drawer";
import { PageTransition } from "@/components/page-transition";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex flex-col min-h-screen bg-mauria-light-bg dark:bg-mauria-dark-bg">
        <FirstLaunchDrawer />
        <NewUpdateDrawer />
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-mauria-light-purple dark:bg-mauria-dark-bg">
          <h1 className="text-2xl font-bold text-white">Mauria</h1>
          {/* <Button variant="ghost" size="icon" className="text-white">
            <MenuIcon className="h-6 w-6" />
          </Button> */}
          <ThemeToggle />
        </header>

        {/* Main Content */}
        <PageTransition as="main" className="flex-1 px-4 pb-20">
          {children}
        </PageTransition>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </ThemeProvider>
  );
}
