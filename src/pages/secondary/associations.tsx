"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { fetchAssos } from "@/lib/api/supa";
import { AssociationData } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { useLoadingToast } from "@/hooks/useLoadingToast";
import { useTranslation } from "react-i18next";

function AssociationImage({
    src,
    alt,
    className,
    fallbackClassName,
}: {
    src?: string | null;
    alt: string;
    className?: string;
    fallbackClassName?: string;
}) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className={fallbackClassName}>
                <span className="sr-only">{alt}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}

export function AssociationsPage() {
    const {
        data: associations = [],
        isLoading,
        isFetching,
    } = useQuery<AssociationData[], Error>({
        queryKey: ["associations"],
        queryFn: () => fetchAssos().then((res) => res || []),
        staleTime: 1000 * 60 * 5, // 5 min frais
        gcTime: 1000 * 60 * 60 * 24, // 24h cache
    });

    useLoadingToast(
        isLoading || isFetching,
        "Associations en cours de chargement…",
        "associations-loading"
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssociation, setSelectedAssociation] =
        useState<AssociationData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { t } = useTranslation();

    const handleAssociationClick = (association: AssociationData) => {
        setSelectedAssociation(association);
        setIsDrawerOpen(true);
    };

    const filteredAssociations = useMemo(() => {
        return associations.filter((association) => {
            const matchesSearch =
                association.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                association.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [associations, searchTerm]);

    return (
        <div className="mt-4 space-y-6 sm:px-6 lg:px-0">
            <div className="mx-auto w-full max-w-4xl space-y-6">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={t("associationsPage.search")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                    {t("associationsPage.associationsCount", {
                        count: filteredAssociations.length,
                    })}
                </div>
            </div>
            {/* Associations Grid */}
            <div className="mx-auto w-full max-w-5xl">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filteredAssociations.map((association, index) => (
                        <Card
                            key={index}
                            className="group relative flex h-full min-h-[88px] w-full items-center overflow-hidden rounded-lg border border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[88px] cursor-pointer"
                            onClick={() => handleAssociationClick(association)}
                        >
                            <CardContent className="flex h-full w-full flex-col p-2 sm:p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-1 items-center gap-2 text-left">
                                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md sm:h-10 sm:w-10">
                                            <AssociationImage
                                                src={association.image}
                                                alt={association.name}
                                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                                fallbackClassName="h-full w-full rounded-md border border-dashed border-border/60 bg-transparent"
                                            />
                                        </div>
                                        <h3 className="flex min-h-[2.5rem] flex-1 items-center break-words text-sm font-semibold leading-tight text-foreground">
                                            {association.name}
                                        </h3>
                                    </div>
                                </div>
                                <p className="line-clamp-2 text-xs text-muted-foreground text-left">
                                    {association.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="bg-card border-border pb-safe">
                    {selectedAssociation && (
                        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                            <DrawerHeader className="px-0 pb-0 text-left">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                    <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-lg sm:mx-0 sm:h-20 sm:w-20">
                                        <AssociationImage
                                            src={selectedAssociation.image}
                                            alt={selectedAssociation.name}
                                            className="h-full w-full object-cover"
                                            fallbackClassName="h-full w-full rounded-lg border border-dashed border-border/60 bg-transparent"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2 text-center sm:text-left">
                                        <DrawerTitle className="text-2xl font-semibold text-foreground sm:text-[26px]">
                                            {selectedAssociation.name}
                                        </DrawerTitle>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="max-h-[60vh] space-y-6 overflow-y-auto pb-8 pt-4">
                                <DrawerDescription className="mt-1 text-base leading-relaxed text-foreground sm:mt-2">
                                    {selectedAssociation.description}
                                </DrawerDescription>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="flex-1 bg-transparent"
                                        disabled={!selectedAssociation.contact}
                                    >
                                        <a
                                            href={selectedAssociation.contact}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            {t("associationsPage.contactUs")}
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>

            {filteredAssociations.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                        {'Aucune association trouvée pour "' + searchTerm + '"'}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchTerm("");
                        }}
                        className="mt-4"
                    >
                        {t("associationsPage.reinitialize")}
                    </Button>
                </div>
            )}
        </div>
    );
}
