// pages/secondary/login.tsx
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { fetchUser, setSession } from "@/lib/api/aurion";
import Meteors from "@/components/ui/shadcn-io/meteors";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const response = await fetchUser({ email, password });

            if (response?.success) {
                setSession(email, password);
                window.location.href = "/";
            } else {
                toast.error("Identifiants invalides", {
                    description:
                        "Vérifie l’email et le mot de passe, puis réessaie.",
                });
            }
        } catch (err) {
            toast.error("Erreur serveur", {
                description: `Impossible de se connecter pour le moment.\n${err}`,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
                <Meteors number={50} />
            </div>
            <div className="relative min-h-screen flex items-center justify-center px-3">
                <h1 className="absolute top-16 md:top-20 w-full text-center text-mauria-purple font-extrabold text-6xl md:text-7xl leading-none tracking-tight drop-shadow-lg pointer-events-none">
                    Mauria
                </h1>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Connexion</CardTitle>
                        <CardDescription>
                            Entrez vos identifiants Aurion pour accéder à l'app
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Connexion..." : "Se connecter"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}
