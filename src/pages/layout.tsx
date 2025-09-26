import BottomNavigation from "@/components/bottom-navigation";
import FirstLaunchDrawer from "@/components/first-launch-drawer";
import NewUpdateDrawer from "@/components/new-update-drawer";
import { PageTransition } from "@/components/page-transition";
import Sidebar from "@/components/sidebar";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { Outlet } from "react-router";

export default function RootLayout() {
    return (
        <div className="flex flex-col min-h-full bg-mauria-bg ">
            <Particles
                className="absolute inset-0 opacity-50 z-0"
                staticity={10}
                color="#ef6b41"
                quantity={100}
                ease={70}
                size={1.5}
            />
            <FirstLaunchDrawer />
            <NewUpdateDrawer />
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-mauria-purple z-10 ">
                <h1 className="text-2xl font-bold text-white">Mauria</h1>
                {/* <Button variant="ghost" size="icon" className="text-white">
                        <MenuIcon className="h-6 w-6" />
                        </Button> */}
                <Sidebar />
            </header>
            {/* Main Content */}
            <PageTransition as="main" className="flex-1 px-4 pb-20 z-10">
                <Outlet />
            </PageTransition>

            {/* Bottom Navigation */}
            <BottomNavigation />
        </div>
    );
}
