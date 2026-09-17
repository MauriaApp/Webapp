"use client";

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
import { UpdatesEntry } from "@/types/data";
import { useTranslation } from "react-i18next";

export function UpdateDrawer({
    update,
    open,
    onOpenChange,
}: {
    update: UpdatesEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="p-0 pb-safe max-h-[85vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 z-10 bg-background/95 supports-backdrop-filter:bg-background/60 border-b">
                    <DrawerHeader className="px-6 pt-6 pb-3 items-center text-center">
                        <DrawerTitle className="flex items-center justify-center gap-2">
                            {t("update.somethingNew")}
                        </DrawerTitle>
                        <div className="mb-3 flex flex-col items-center gap-3 text-sm text-muted-foreground">
                            <p>
                                {t("update.seeEnhancements")} {update.version}
                            </p>
                            <Badge variant="secondary">{update.date}</Badge>
                        </div>
                    </DrawerHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 touch-pan-y [-webkit-overflow-scrolling:touch]">
                    <Alert className="mb-4">
                        <Eye className="h-4 w-4" />
                        <AlertTitle>
                            {t("update.visualImprovements")}
                        </AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                                {formatUpdateContentList(
                                    update.contentVisu ?? ""
                                ).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <Alert className="mb-4">
                        <CodeXml className="h-4 w-4" />
                        <AlertTitle>
                            {t("update.technicalImprovements")}
                        </AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
                                {formatUpdateContentList(
                                    update.contentDev ?? ""
                                ).map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                </div>

                <DrawerFooter className="px-6 pb-safe-offset-6 border-t">
                    <DrawerClose asChild>
                        <Button>{t("update.discardButton")}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
