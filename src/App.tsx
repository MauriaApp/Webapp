import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";

import { ModalContextProvider } from "./contexts/modalContext";
import { ToastContextProvider } from "./contexts/toastContent";
import AbsencesPage from "./pages/absences/page";
import Home from "./pages/page";
import PlanningPage from "./pages/planning/page";
import NotesPage from "./pages/notes/page";

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/absences" element={<AbsencesPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ToastContextProvider>
      <ModalContextProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ModalContextProvider>
    </ToastContextProvider>
  );
}

export default App;
