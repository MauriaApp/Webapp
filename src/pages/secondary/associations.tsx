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
    DrawerTrigger,
} from "@/components/ui/drawer";
import { fetchAssos } from "@/lib/api/supa";
import { AssociationData } from "@/types/data";
import { useQuery } from "@tanstack/react-query";
import { useLoadingToast } from "@/hooks/useLoadingToast";

export function AssociationsPage() {
    const { data: associations = [], isLoading, isFetching } = useQuery<
        AssociationData[],
        Error
    >({
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
        <div className="space-y-4 mt-4">
            {/* Search and Filters */}
            <div className="space-y-6">
                <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher une association..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Results count */}
            <div className="text-center text-muted-foreground">
                {filteredAssociations.length} association
                {filteredAssociations.length > 1 ? "s" : ""} trouvée
                {filteredAssociations.length > 1 ? "s" : ""}
            </div>

            {/* Associations Grid */}
            <div className="flex flex-wrap justify-center gap-3">
                {filteredAssociations.map((association, index) => (
                    <Drawer key={index}>
                        <DrawerTrigger asChild>
                            <Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-card border-border w-[150px] flex-shrink-0">
                                <CardContent className="p-0">
                                    <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                                        <img
                                            src={
                                                association.image ||
                                                "/placeholder.svg"
                                            }
                                            alt={association.name}
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                                            {association.name}
                                        </h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {association.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DrawerTrigger>

                        <DrawerContent className="bg-card border-border max-h-[70vh]">
                            <div className="mx-auto w-full max-w-2xl">
                                <DrawerHeader className="text-left ml-10">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 relative overflow-hidden rounded-lg flex-shrink-0">
                                            <img
                                                src={
                                                    association.image ||
                                                    "/placeholder.svg"
                                                }
                                                alt={association.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <DrawerTitle className="text-2xl text-foreground">
                                                {association.name}
                                            </DrawerTitle>
                                        </div>
                                    </div>
                                </DrawerHeader>

                                <div className="px-4 pb-6 space-y-6 overflow-y-scroll max-h-[50vh]">
                                    <DrawerDescription className="text-foreground text-base leading-relaxed">
                                        {association.description}
                                    </DrawerDescription>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="flex-1 bg-transparent"
                                            disabled={!association.contact}
                                        >
                                            <a
                                                href={association.contact}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Nous contacter !
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                ))}
            </div>

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
                        Réinitialiser
                    </Button>
                </div>
            )}
        </div>
    );
}
