"use client";

import { memo, useMemo, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { AurionDownState } from "@/components/aurion-down-state";
import { useJuniaStatus } from "@/lib/hooks/use-junia-status";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchDocuments, downloadDocument } from "@/lib/api/aurion";
import { useQuery } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { AurionDocument, DocumentsResult } from "@/types/aurion";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { fadeIn, staggerGroup } from "@/lib/motion";
import { CarouselItem, FilterCarousel } from "@/components/filter-carousel";
import { toast } from "sonner";

export function DocumentsPage() {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null
    );
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const {
        data: result,
        refetch,
        isLoading,
        isFetching,
    } = useQuery<DocumentsResult, Error>({
        queryKey: ["documents"],
        queryFn: async (): Promise<DocumentsResult> => {
            const res = await fetchDocuments();
            if (!res?.success || !res.data) {
                throw new Error("Failed to fetch documents");
            }
            return res.data;
        },
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: true,
        placeholderData: (previousData) => previousData,
    });

    const documents = result?.documents ?? [];
    const categories = result?.categories ?? [];

    const isBusy = isLoading || isFetching;
    const aurionDown = useJuniaStatus()?.aurionDown ?? false;
    const handleRefresh = () => refetch();

    // Build the filter carousel dynamically from the categories returned
    // by the API (in Aurion's sidebar order).  Labels come directly from
    // Aurion — no hardcoded category keys.
    const categoryItems = useMemo<CarouselItem[]>(() => {
        if (categories.length === 0) return [];
        return [
            { value: null, label: t("documentsPage.allCategories") },
            ...categories.map((c) => ({ value: c.menuid, label: c.label })),
        ];
    }, [categories, t]);

    // Map menuid → label for the card subtitle.
    const categoryLabels = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of categories) map.set(c.menuid, c.label);
        return map;
    }, [categories]);

    const displayedDocuments = useMemo(() => {
        if (!selectedCategory) return documents;
        return documents.filter((d) => d.category === selectedCategory);
    }, [documents, selectedCategory]);

    const handleDownload = async (doc: AurionDocument) => {
        const id = `${doc.category}-${doc.docIndex}`;
        if (downloadingId === id) return;
        setDownloadingId(id);
        const filename = await downloadDocument(doc);
        setDownloadingId(null);
        if (filename) {
            toast.success(t("documentsPage.downloadSuccess", { filename }));
        } else {
            toast.error(t("documentsPage.downloadError"));
        }
    };

    const filterKey = selectedCategory ?? "all";

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            className="space-y-4 pt-4"
            isPullable={!isBusy}
            pullingText={t("common.pullToRefresh")}
            refreshingText={t("common.refreshing")}
        >
            <motion.div
                variants={staggerGroup}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={fadeIn} className="space-y-3 mb-4">
                    {categoryItems.length > 1 && (
                        <FilterCarousel
                            items={categoryItems}
                            selected={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    )}
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {displayedDocuments.length === 0 ? (
                        <motion.div
                            key={`empty-${filterKey}`}
                            variants={fadeIn}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                        >
                            <div className="text-center py-12">
                                <div className="bg-mauria-card rounded-xl shadow-md p-8 max-w-md mx-auto">
                                    {aurionDown && documents.length === 0 ? (
                                        <AurionDownState
                                            message={t(
                                                "documentsPage.noDocumentsCached"
                                            )}
                                        />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                {isBusy ? (
                                                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                                ) : (
                                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">
                                                {isBusy
                                                    ? t("common.loading")
                                                    : t(
                                                          "documentsPage.noDocuments"
                                                      )}
                                            </h3>
                                            {!isBusy && (
                                                <p className="text-muted-foreground">
                                                    {t(
                                                        "documentsPage.noDocumentsPlaceholder"
                                                    )}
                                                </p>
                                            )}
                                            {isBusy && (
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        "documentsPage.loadingHint"
                                                    )}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`list-${filterKey}`}
                            className="space-y-3 pb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.15 },
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {displayedDocuments.map((doc) => {
                                    const id = `${doc.category}-${doc.docIndex}-${doc.submitParam}`;
                                    return (
                                        <DocumentCard
                                            key={id}
                                            doc={doc}
                                            categoryLabel={
                                                categoryLabels.get(
                                                    doc.category
                                                ) ?? doc.category
                                            }
                                            downloading={downloadingId === id}
                                            onDownload={() =>
                                                handleDownload(doc)
                                            }
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </PullToRefresh>
    );
}

const DocumentCard = memo(function DocumentCard({
    doc,
    categoryLabel,
    downloading,
    onDownload,
}: {
    doc: AurionDocument;
    categoryLabel: string;
    downloading: boolean;
    onDownload: () => void;
}) {
    return (
        <Card className="border-none bg-white shadow-md dark:bg-mauria-card overflow-hidden">
            <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium truncate">
                        {doc.label}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{categoryLabel}</span>
                        {doc.size && (
                            <>
                                <span>·</span>
                                <span className="shrink-0">{doc.size}</span>
                            </>
                        )}
                    </div>
                    {doc.type && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                            {doc.type}
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 [&_svg]:size-5"
                    onClick={onDownload}
                    disabled={downloading}
                >
                    {downloading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Download />
                    )}
                </Button>
            </CardContent>
        </Card>
    );
});
