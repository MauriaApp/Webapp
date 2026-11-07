"use client";

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { fadeIn, staggerGroup } from "@/lib/motion";

/**
 * Helpful documents published by partner organizations, bundled in /public.
 * Each page is a WebP image (regenerate from the PDF with:
 * pdftoppm -r 150 -png guide.pdf && convert to WebP q82), stacked
 * vertically so the guide reads like a scroll.
 */
const DOCUMENTS = [
    {
        id: "europeMobility",
        pages: 48,
        pdf: "/docs/destination-europe.pdf",
        images: "/docs/europe-mobility",
        source: "Information Jeunesse Hauts-de-France",
    },
] as const;

/** One document: header, then its pages one below the other. */
function DocViewer({ doc }: { doc: (typeof DOCUMENTS)[number] }) {
    const { t } = useTranslation();
    const title = t(`internshipsPage.documents.${doc.id}.title`);

    return (
        <motion.div
            variants={fadeIn}
            className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card"
        >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
                <div className="flex min-w-0 items-center gap-1.5 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-semibold text-foreground">
                        {title}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                        {" · "}
                        {doc.source}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="h-8 w-8 shrink-0"
                >
                    <a
                        href={doc.pdf}
                        download
                        aria-label={t("internshipsPage.download")}
                    >
                        <Download className="h-4 w-4" />
                    </a>
                </Button>
            </div>

            <div className="flex flex-col items-center">
                {Array.from({ length: doc.pages }, (_, index) => (
                    <img
                        key={index}
                        src={`${doc.images}/p-${String(index + 1).padStart(2, "0")}.webp`}
                        alt={`${title} — ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full"
                    />
                ))}
            </div>
        </motion.div>
    );
}

export function InternshipDocs() {
    const { t } = useTranslation();

    return (
        <motion.div
            className="space-y-4"
            variants={staggerGroup}
            initial="hidden"
            animate="show"
        >
            <motion.p
                variants={fadeIn}
                className="text-center text-sm text-muted-foreground"
            >
                {t("internshipsPage.docsIntro")}
            </motion.p>

            {DOCUMENTS.map((doc) => (
                <DocViewer key={doc.id} doc={doc} />
            ))}
        </motion.div>
    );
}
