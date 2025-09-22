import { AnimatePresence } from "framer-motion";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router";

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

const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const connected = !!getSession();

    if (!connected) {
        // redirige vers /login mais garde la route demandée en state
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
                </Route>
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <ToastContextProvider>
            <ModalContextProvider>
                <ThemeProvider defaultTheme="light">
                    <BrowserRouter>
                        <ReactQueryProvider>
                            <CurrentYearProvider>
                                <AppRoutes />
                            </CurrentYearProvider>
                        </ReactQueryProvider>
                    </BrowserRouter>
                </ThemeProvider>
            </ModalContextProvider>
        </ToastContextProvider>
    );
}

export default App;
