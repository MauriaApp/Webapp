import BottomNavigation from "@/components/bottom-navigation";
import { useBackground } from "@/components/background-provider";
import NewUpdateDrawer from "@/components/new-update-drawer";
import { PageTransition } from "@/components/page-transition";
import Sidebar from "@/components/sidebar";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { memo, useMemo } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern";

const BottomNav = memo(BottomNavigation);
const ParticlesMemo = memo(Particles);
const GridPatternMemo = memo(GridPattern);
const SidebarMemo = memo(Sidebar);
const PageTransitionMemo = memo(PageTransition);

export default function RootLayout() {
    const { t } = useTranslation();
    const { background } = useBackground();

    const backgroundElement = useMemo(() => {
        switch (background) {
            case "particles":
                return (
                    <ParticlesMemo
                        className="absolute inset-0 opacity-50 z-0"
                        staticity={10}
                        color="var(--particles-color)"
                        quantity={100}
                        ease={70}
                        size={1.5}
                    />
                );
            case "grid":
                return (
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <GridPatternMemo
                            squares={[]}
                            className={cn(
                                "absolute left-0 w-full top-[-30%] h-[160vh] pointer-events-none transform",
                                "[--mask-r:clamp(400px,70vw,3000px)]",
                                "[mask-image:radial-gradient(var(--mask-r)_circle_at_center,white,transparent)]",
                                "skew-y-12"
                            )}
                        />
                    </div>
                );
            default:
                return null;
        }
    }, [background]);

    return (
        <div className="flex flex-col min-h-full bg-mauria-bg overflow-hidden relative">
            {backgroundElement}
            <NewUpdateDrawer />
            {/* Header */}
            <header className="flex items-center justify-between px-4 pb-4 pt-safe-or-4 bg-mauria-purple oled:bg-black z-10">
                <h1 className="text-2xl font-bold text-white">
                    {t("welcome.mauria")}
                </h1>
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
