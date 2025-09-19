import Home from "./pages/page";
import PlanningPage from "./pages/planning/page";
import { GradesPage } from "./pages/grades/page";
import { AbsencesPage } from "./pages/absences/page";
import { ToastContextProvider } from "./contexts/toastContent";
import { ModalContextProvider } from "./contexts/modalContext";

import { BrowserRouter, Route, Routes } from "react-router";
import RootLayout from "./pages/layout";
import { CurrentYearProvider } from "./contexts/currentYearContext";

function App() {
    return (
        <ToastContextProvider>
            <ModalContextProvider>
                <BrowserRouter>
                    <RootLayout>
                        <CurrentYearProvider>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route
                                    path="/planning"
                                    element={<PlanningPage />}
                                />
                                <Route
                                    path="/grades"
                                    element={<GradesPage />}
                                />
                                <Route
                                    path="/absences"
                                    element={<AbsencesPage />}
                                />
                            </Routes>
                        </CurrentYearProvider>
                    </RootLayout>
                </BrowserRouter>
            </ModalContextProvider>
        </ToastContextProvider>
    );
}

export default App;
