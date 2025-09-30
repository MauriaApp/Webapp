import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/i18n";
import "@/styles/globals.css";
import { ErrorBoundary } from "./components/error-boundary.tsx";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.log("Service Worker enregistré:", registration);
            })
            .catch((error) => {
                console.error(
                    "Erreur lors de l’enregistrement du Service Worker:",
                    error
                );
            });
    });
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>
);
