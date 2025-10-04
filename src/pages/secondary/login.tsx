// pages/secondary/login.tsx
import { useEffect, useState } from "react";
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
import { Eye, EyeOff, Languages } from "lucide-react";
import { getFromStorage } from "@/lib/utils/storage";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    applyLocale,
    readInitialLocale,
    type LocaleOption,
} from "@/lib/utils/translations";

const FIRST_LAUNCH_KEY = "firstLaunch";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [locale, setLocale] = useState<LocaleOption>(readInitialLocale);
    const { t } = useTranslation();

    useEffect(() => {
        applyLocale(locale);
    }, [locale]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const response = await fetchUser({ email, password });

            if (response?.success) {
                setSession(email, password);

                let shouldShowWelcome = false;
                try {
                    const alreadyLaunched = getFromStorage(FIRST_LAUNCH_KEY);
                    shouldShowWelcome = alreadyLaunched !== "true";
                } catch (error) {
                    console.error(
                        "Impossible de récupérer l'état de premier lancement",
                        error
                    );
                }

                window.location.href = shouldShowWelcome ? "/welcome" : "/";
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
            <div className="relative min-h-screen flex items-center justify-center px-3 py-safe">
                <h1 className="absolute top-safe-offset-16 md:top-safe-offset-20 w-full text-center text-mauria-purple font-extrabold text-6xl md:text-7xl leading-none tracking-tight drop-shadow-lg pointer-events-none">
                    {t("login.mauria")}
                </h1>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t("login.login")}</CardTitle>
                        <CardDescription>
                            {t("login.enterAurionCredentials")}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("login.email")}</Label>
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
                                <Label htmlFor="password">{t("login.password")}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
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
                <div className="absolute bottom-safe-offset-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Languages className="h-4 w-4" />
                        <span>{t("sidebar.languageParameter.title")}</span>
                    </div>
                    <ToggleGroup
                        size="sm"
                        type="single"
                        value={locale}
                        onValueChange={(value) => value && setLocale(value as LocaleOption)}
                        className="inline-flex gap-0 rounded-md border border-border/50 overflow-hidden"
                        aria-label={t("sidebar.languageParameter.aria") ?? "Choose language"}
                    >
                        <ToggleGroupItem
                            value="fr-FR"
                            className="rounded-none first:rounded-l-md h-8 px-2 text-xs border-l border-border/50 first:border-l-0 -ml-px first:ml-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                            {t("sidebar.languageParameter.fr-FR")}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="en-US"
                            className="rounded-none h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                            {t("sidebar.languageParameter.en-US")}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="es-ES"
                            className="rounded-none last:rounded-r-md h-8 px-2 text-xs border-l border-border/50 -ml-px data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                            {t("sidebar.languageParameter.es-ES")}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
        </>
    );
}
