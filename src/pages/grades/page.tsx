"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { GradeCard } from "./grade-card";
import { useCurrentYear } from "@/contexts/currentYearContext";
import { getGrades } from "@/utils/notes";

export function GradesPage() {
    const { showCurrentYearOnly, toggleCurrentYearFilter } = useCurrentYear();

    const merged = getGrades({ showCurrentYearOnly });

    return (
        <main className="max-w-3xl mx-auto p-4 space-y-4">
            <div className="flex items-center gap-2">
                <Switch
                    id="onlyThisYear"
                    checked={showCurrentYearOnly}
                    onCheckedChange={toggleCurrentYearFilter}
                />
                <Label htmlFor="onlyThisYear">
                    Afficher uniquement cette année
                </Label>
            </div>

            {merged.length === 0 ? (
                <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Aucune note pour l'instant</AlertTitle>
                </Alert>
            ) : (
                <div className="space-y-2">
                    {merged.map((note, index) => (
                        <GradeCard key={index} note={note} />
                    ))}
                </div>
            )}
        </main>
    );
}
