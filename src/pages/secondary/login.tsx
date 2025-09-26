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
import { Eye, EyeOff } from "lucide-react";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={
                                            showPassword
                                                ? "Masquer le mot de passe"
                                                : "Afficher le mot de passe"
                                        }
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        disabled={loading}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
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
