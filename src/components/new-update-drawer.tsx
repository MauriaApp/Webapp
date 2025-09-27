"use client";

import { useEffect, useState } from "react";
import { CodeXml, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { formatUpdateContentList } from "@/lib/utils/updates";
import { fetchUpdates } from "@/lib/api/supa";
import { useQuery } from "@tanstack/react-query";
import { UpdatesEntry } from "@/types/data";

const LAST_SEEN_UPDATE_KEY = "lastSeenUpdate";

export default function NewUpdateDrawer() {
    const [open, setOpen] = useState(false);
    const [update, setUpdate] = useState<UpdatesEntry | null>(null);

    const { data: updates } = useQuery({
        queryKey: ["updates"],
        queryFn: fetchUpdates,
        staleTime: 1000 * 60 * 5, // 5 min
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
        refetchOnMount: true,
    });

    useEffect(() => {
        if (updates?.length) {
            const last = updates[0]?.version ?? null;
            if (last) {
                const seen = localStorage.getItem(LAST_SEEN_UPDATE_KEY);
                if (seen !== last) {
                    console.log("New update, showing the new update modal.");
                    localStorage.setItem(LAST_SEEN_UPDATE_KEY, last);
                    setOpen(true);
                }
            }
            setUpdate(updates[0] ?? null);
        }
    }, [updates]);

    if (update === null) return null;

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent className="p-0 pb-safe max-h-[85vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 z-10 bg-background/95 supports-backdrop-filter:bg-background/60 border-b">
                    <DrawerHeader className="px-6 pt-6 pb-3 items-center text-center">
                        <DrawerTitle className="flex items-center justify-center gap-2">
                            Y'a du nouveau sur Mauria !
                        </DrawerTitle>
                        <p className="text-sm text-muted-foreground mb-3 text-center">
                            Voici les améliorations apportées par la mise à jour{" "}
                            {update?.version}
                            <br />
                            <br />
                            <Badge variant="secondary">{update?.date}</Badge>
                        </p>
                    </DrawerHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 touch-pan-y [-webkit-overflow-scrolling:touch]">
                    <Alert className="mb-4">
                        <Eye className="h-4 w-4" />
                        <AlertTitle>Améliorations visuelles</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                                {formatUpdateContentList(
                                    update?.contentVisu ?? ""
                                ).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <Alert className="mb-4">
                        <CodeXml className="h-4 w-4" />
                        <AlertTitle>Améliorations techniques</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                                {formatUpdateContentList(
                                    update?.contentDev ?? ""
                                ).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                </div>

                <DrawerFooter className="px-6 pb-safe-offset-6 border-t">
                    <DrawerClose asChild>
                        <Button>D'accord !</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
