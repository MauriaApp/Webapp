import BottomNavigation from "@/components/bottom-navigation";
import { useBackground } from "@/components/background-provider";
import NewUpdateDrawer from "@/components/new-update-drawer";
import { PageTransition } from "@/components/page-transition";
import { ProgressRing } from "@/components/progress-ring";
import Sidebar from "@/components/sidebar";
import { Particles } from "@/components/ui/shadcn-io/particles";
import { AnimatePresence, motion } from "framer-motion";
import { useIsFetching } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { GridPattern } from "@/components/ui/shadcn-io/grid-pattern";
import { Topography } from "@/components/ui/shadcn-io/topography";
import { DotPattern } from "@/components/ui/shadcn-io/dot-pattern";
import { useFetchProgress } from "@/lib/hooks/use-fetch-progress";
import { BLINK_EVENT, useJuniaStatus } from "@/lib/hooks/use-junia-status";
import { ServerCrash } from "lucide-react";

const BottomNav = memo(BottomNavigation);
const ParticlesMemo = memo(Particles);
const GridPatternMemo = memo(GridPattern);
const TopographyMemo = memo(Topography);
const DotPatternMemo = memo(DotPattern);
const SidebarMemo = memo(Sidebar);
const PageTransitionMemo = memo(PageTransition);

export default function RootLayout() {
    const { t } = useTranslation();
    const { background } = useBackground();
    const activeFetches = useIsFetching();
    const {
        progress: fetchProgress,
        visible: fetchSpinnerVisible,
        done: fetchDone,
    } = useFetchProgress();
    const aurionDown = useJuniaStatus()?.aurionDown ?? false;
    const showGlobalSpinner = activeFetches > 0 || fetchSpinnerVisible;
    const [renderSpinner, setRenderSpinner] = useState(showGlobalSpinner);
    // While Aurion is down the ring is replaced by a crashed-server icon that
    // only exists for its blink animation. Only one blink plays at a time:
    // triggers received while it runs are ignored.
    const [blinking, setBlinking] = useState(false);
    const blinkingRef = useRef(false);
    const triggerBlink = useCallback(() => {
        if (blinkingRef.current) return;
        blinkingRef.current = true;
        setBlinking(true);
    }, []);
    const endBlink = useCallback(() => {
        blinkingRef.current = false;
        setBlinking(false);
    }, []);

    // Aurion came back mid-blink: the icon unmounts without completing.
    useEffect(() => {
        if (!aurionDown) endBlink();
    }, [aurionDown, endBlink]);

    // Blink at the start of every fetch cycle while Aurion is down.
    const shouldBlink = aurionDown && showGlobalSpinner;
    const wasBlinking = useRef(false);
    useEffect(() => {
        if (shouldBlink && !wasBlinking.current) triggerBlink();
        wasBlinking.current = shouldBlink;
    }, [shouldBlink, triggerBlink]);

    // ...and on demand (pull-to-refresh), when no new fetch cycle begins.
    useEffect(() => {
        if (!aurionDown) return;
        window.addEventListener(BLINK_EVENT, triggerBlink);
        return () => window.removeEventListener(BLINK_EVENT, triggerBlink);
    }, [aurionDown, triggerBlink]);

    useEffect(() => {
        if (showGlobalSpinner) {
            setRenderSpinner(true);
            return;
        }

        if (!renderSpinner) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setRenderSpinner(false);
        }, 250);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [showGlobalSpinner, renderSpinner]);

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
                                "skew-y-12",
                                "fill-current/50 stroke-current/50"
                            )}
                        />
                    </div>
                );
            case "topography":
                return <TopographyMemo className="absolute inset-0 z-0" />;
            case "dot-pattern":
                return <DotPatternMemo className="absolute inset-0 z-0" />;
            default:
                return null;
        }
    }, [background]);

    return (
        <div className="flex flex-col min-h-full bg-mauria-bg overflow-hidden relative">
            {backgroundElement}
            <NewUpdateDrawer />
            {/* Header */}
            <header className="flex items-center justify-between px-4 pb-4 pt-safe-offset-4 bg-mauria-purple oled:bg-black z-10">
                <h1 className="text-2xl font-bold text-white">
                    {t("welcome.mauria")}
                </h1>
                {/* <Button variant="ghost" size="icon" className="text-white">
                        <MenuIcon className="h-6 w-6" />
                        </Button> */}
                <div className="flex items-center gap-3">
                    <AnimatePresence initial={false}>
                        {renderSpinner && !aurionDown && (
                            <motion.div
                                key="sidebar-global-loader"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{
                                    duration: 0.4,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className="flex items-center text-white origin-center"
                            >
                                <div className="relative">
                                    <ProgressRing
                                        value={fetchProgress}
                                        size={28}
                                        strokeWidth={3}
                                    />
                                    {/* Everything fetched: a check draws
                                        itself inside the completed circle,
                                        then leaves with it at fade-out. */}
                                    <AnimatePresence>
                                        {fetchDone && (
                                            <motion.svg
                                                key="completion-check"
                                                viewBox="0 0 28 28"
                                                className="absolute inset-0"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: "easeOut",
                                                }}
                                            >
                                                <motion.path
                                                    d="M9.5 14.5 L12.8 17.8 L18.5 10.8"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={3}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{
                                                        pathLength: 0,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        pathLength: 1,
                                                        opacity: 1,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.35,
                                                        ease: [0.16, 1, 0.3, 1],
                                                    }}
                                                />
                                            </motion.svg>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <span className="sr-only">
                                    {t("common.loading")}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Aurion down: 3 slow blinks, then the icon unmounts */}
                    {blinking && aurionDown && (
                        <motion.div
                            className="flex items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0, 1, 0, 1, 0] }}
                            transition={{ duration: 1.8, ease: "linear" }}
                            onAnimationComplete={endBlink}
                        >
                            <ServerCrash className="h-6 w-6 text-red-300 oled:text-red-400" />
                            <span className="sr-only">
                                {t("homePage.aurionDownTitle")}
                            </span>
                        </motion.div>
                    )}
                    <SidebarMemo />
                </div>
            </header>
            {/* Main Content */}
            <PageTransitionMemo
                as="main"
                className="flex-1 px-4 pb-safe-offset-24 z-10"
            >
                <Outlet />
            </PageTransitionMemo>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
