import BottomNavigation from "@/components/bottom-navigation";
import NewUpdateDrawer from "@/components/new-update-drawer";
import { PageTransition } from "@/components/page-transition";
import Sidebar from "@/components/sidebar";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { memo } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";

const BottomNav = memo(BottomNavigation);
const ParticlesMemo = memo(Particles);
const SidebarMemo = memo(Sidebar);
const PageTransitionMemo = memo(PageTransition);

export default function RootLayout() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-full bg-mauria-bg overflow-hidden relative">
            <ParticlesMemo
                className="absolute inset-0 opacity-50 z-0"
                staticity={10}
                color="var(--particles-color)"
                quantity={100}
                ease={70}
                size={1.5}
            />
            <NewUpdateDrawer />
            {/* Header */}
            <header className="flex items-center justify-between px-4 pb-4 pt-safe-or-4 bg-mauria-purple oled:bg-black z-10">
                <h1 className="text-2xl font-bold text-white">{t("welcome.mauria")}</h1>
                {/* <Button variant="ghost" size="icon" className="text-white">
                        <MenuIcon className="h-6 w-6" />
                        </Button> */}
                <SidebarMemo />
            </header>
            {/* Main Content */}
            <PageTransitionMemo
                as="main"
                className="flex-1 px-4 pb-safe-offset-20 z-10"
            >
                <Outlet />
            </PageTransitionMemo>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
