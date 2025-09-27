import { AnimatePresence } from "framer-motion";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router";
import { Toaster } from "@/components/ui/sonner";

import { ModalContextProvider } from "./contexts/modalContext";
import { ToastContextProvider } from "./contexts/toastContent";
import { AbsencesPage } from "./pages/absences/page";
import { HomePage } from "./pages/home/page";
import { CurrentYearProvider } from "./contexts/currentYearContext";
import RootLayout from "./pages/layout";
import { GradesPage } from "./pages/grades/page";
import { ReactQueryProvider } from "./contexts/reactQueryContext";
import { getSession } from "./lib/api/aurion";
import { ThemeProvider } from "./components/theme-provider";
import { AssociationsPage } from "./pages/secondary/associations";
import { PlanningPage } from "./pages/planning/page";
import { LoginPage } from "./pages/secondary/login";
import { AgendaPage } from "./pages/secondary/agenda";
import { WelcomePage } from "./pages/secondary/welcome";
import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import { overrideStorage, saveFromApp } from "./lib/utils/storage";

if (import.meta.env.PROD) {
    console.log("Initializing Sentry in production mode...");
    Sentry.init({
        dsn: "https://43f1e4d5385f6aac1b8e60ececf90921@o4510087561412608.ingest.us.sentry.io/4510087561740288",
        // Setting this option to true will send default PII data to Sentry.
        // For example, automatic IP address collection on events
        sendDefaultPii: true,
        integrations: [
            Sentry.replayIntegration(),
            Sentry.browserTracingIntegration(),
        ],
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
        tracesSampleRate: 1.0, // Adjust this value in production as needed
    });
}

const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const connected = !!getSession();

    if (!connected) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/login/*" element={<LoginPage />} />
                <Route
                    path="/welcome"
                    element={
                        <RequireAuth>
                            <WelcomePage />
                        </RequireAuth>
                    }
                />
                <Route
                    element={
                        <RequireAuth>
                            <RootLayout />
                        </RequireAuth>
                    }
                >
                    <Route path="/" element={<HomePage />} />
                    <Route path="/planning" element={<PlanningPage />} />
                    <Route path="/grades" element={<GradesPage />} />
                    <Route path="/absences" element={<AbsencesPage />} />
                    <Route
                        path="/associations"
                        element={<AssociationsPage />}
                    />
                    <Route path="/agenda" element={<AgendaPage />} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Écouter la réponse d'Ionic pour récupérer une donnée
        const handleMessage = (event: MessageEvent) => {
            const { type, key, payload } = event.data;
            if (type === "DATA_RESPONSE" && key) {
                console.log(`Donnée reçue pour ${key}: `, payload);
                saveFromApp(key, payload);
            }
            if (type === "ALL_DATA_RESPONSE" && payload) {
                console.log("Toutes les données reçues: ", payload);
                for (const [k, v] of Object.entries(payload)) {
                    overrideStorage({ [k]: v } as Record<string, string>);
                }
                setIsLoading(false);
            }
        };

        console.log("Requesting all data from parent...");
        window.parent.postMessage({ type: "REQUEST_ALL_DATA" }, "*");

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <ThemeProvider defaultTheme="light">
            <ToastContextProvider>
                <ModalContextProvider>
                    <Toaster richColors position="top-center" />
                    <BrowserRouter>
                        <ReactQueryProvider>
                            <CurrentYearProvider>
                                <AppRoutes />
                            </CurrentYearProvider>
                        </ReactQueryProvider>
                    </BrowserRouter>
                </ModalContextProvider>
            </ToastContextProvider>
        </ThemeProvider>
    );
}

export default App;
