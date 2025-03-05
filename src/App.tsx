import Home from "./pages/page";
import PlanningPage from "./pages/planning/page";
import NotesPage from "./pages/notes/page";
import AbsencesPage from "./pages/absences/page";
import { ToastContextProvider } from "./contexts/toastContent";
import { ModalContextProvider } from "./contexts/modalContext";

import { BrowserRouter, Route, Routes } from "react-router";

function App() {
  return (
    <ToastContextProvider>
      <ModalContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/absences" element={<AbsencesPage />} />
          </Routes>
        </BrowserRouter>
      </ModalContextProvider>
    </ToastContextProvider>
  );
}

export default App;
