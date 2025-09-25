import React from "react";
import { Button } from "./ui/button";

type Props = {
    children: React.ReactNode;
};

type State = {
    hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
        // Tu peux aussi logger ou envoyer l’erreur ici si besoin
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen gap-4">
                    <h1>Oups, une erreur est survenue.</h1>
                    <Button onClick={() => window.location.reload()}>
                        Retour à l’accueil
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}
