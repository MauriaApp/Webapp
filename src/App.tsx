import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";

import { ModalContextProvider } from "./contexts/modalContext";
import { ToastContextProvider } from "./contexts/toastContent";
import { AbsencesPage } from "./pages/absences/page";
import Home from "./pages/page";
import PlanningPage from "./pages/planning/page";
import { CurrentYearProvider } from "./contexts/currentYearContext";
import RootLayout from "./pages/layout";
import { GradesPage } from "./pages/grades/page";
import LoginPage from "./pages/login";
import { ReactQueryProvider } from "./contexts/reactQueryContext";

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/login/*" element={<LoginPage />} />
                <Route element={<RootLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/planning" element={<PlanningPage />} />
                    <Route path="/grades" element={<GradesPage />} />
                    <Route path="/absences" element={<AbsencesPage />} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <ToastContextProvider>
            <ModalContextProvider>
                <BrowserRouter>
                    <ReactQueryProvider>
                        <CurrentYearProvider>
                            <AppRoutes />
                        </CurrentYearProvider>
                    </ReactQueryProvider>
                </BrowserRouter>
            </ModalContextProvider>
        </ToastContextProvider>
    );
}

export default App;
