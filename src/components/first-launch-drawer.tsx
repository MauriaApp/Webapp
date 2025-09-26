"use client";

import { useEffect, useState } from "react";
import {
    CircleAlert,
    Hand,
    MessageCircleQuestion,
    PanelsTopLeft,
    Shredder,
} from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const FIRST_LAUNCH_KEY = "firstLaunch";

export default function FirstLaunchDrawer() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const alreadyLaunched = localStorage.getItem(FIRST_LAUNCH_KEY);
            if (alreadyLaunched !== "true") {
                console.log("First launch, showing the first launch modal.")
                localStorage.setItem(FIRST_LAUNCH_KEY, "true");
                setOpen(true);
            }
        } catch {
            console.error("Accès à localStorage interdit");
        }
    }, []);

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="p-0 max-h-[85vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 border-b">
                    <DrawerHeader className="px-6 pt-6 pb-3 items-center text-center">
                        <DrawerTitle className="flex items-center justify-center gap-2">
                            Bienvenue sur Mauria !
                        </DrawerTitle>
                        <p className="text-sm text-muted-foreground mb-3 text-center">
                            Voici quelques repères utiles pour démarrer
                        </p>
                    </DrawerHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 touch-pan-y [-webkit-overflow-scrolling:touch]">
                    <Alert className="mb-4">
                        <Hand className="h-4 w-4" />
                        <AlertTitle>Salut !</AlertTitle>
                        <AlertDescription>
                            On a remarqué que c'était ta première fois sur
                            l'application. On te propose de t'expliquer comment
                            ça marche et comment t'y retrouver.
                        </AlertDescription>
                    </Alert>

                    <Alert variant="destructive" className="mb-4">
                        <CircleAlert className="h-4 w-4" />
                        <AlertTitle>Mauria ne remplace pas Aurion !</AlertTitle>
                        <AlertDescription>
                            Mauria est un outil complémentaire à Aurion : il ne
                            remplace ni le site, ni ses données.
                        </AlertDescription>
                    </Alert>

                    <Alert className="mb-4">
                        <PanelsTopLeft className="h-4 w-4" />
                        <AlertTitle>La rapide présentation</AlertTitle>
                        <AlertDescription>
                            L'application est divisé en plusieurs onglets. Tu
                            peux les retrouver en bas de l'écran. Il y a aussi
                            un menu en haut à droite avec des options
                            supplémentaires.
                        </AlertDescription>
                    </Alert>

                    <Alert className="mb-4">
                        <Shredder className="h-4 w-4" />
                        <AlertTitle>Confidentialité au max !</AlertTitle>
                        <AlertDescription>
                            L'application n'enregistre rien sur ses serveurs,
                            tout est stocké sur ton téléphone. De ce fait, tu
                            peux l'utiliser sans connexion internet !
                        </AlertDescription>
                    </Alert>

                    <Alert className="mb-4">
                        <MessageCircleQuestion className="h-4 w-4" />
                        <AlertTitle>Support</AlertTitle>
                        <AlertDescription>
                            Si tu as des questions, n'hésite pas à nous
                            contacter dans l'onglet "Support"
                        </AlertDescription>
                    </Alert>
                </div>

                <DrawerFooter className="px-6 pb-6 border-t">
                    <DrawerClose asChild>
                        <Button>C'est parti !</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
