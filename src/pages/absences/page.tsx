"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getAbsences, getAbsencesDurations } from "@/utils/absences";
import { useMemo } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AbsenceCard } from "./absences-card";
import { useCurrentYear } from "@/contexts/currentYearContext";

export function AbsencesPage() {
    const { showCurrentYearOnly, toggleCurrentYearFilter } = useCurrentYear();

    const absences = getAbsences({ showCurrentYearOnly });

    const { total, justified, unjustified } = useMemo(() => {
        return getAbsencesDurations(absences, showCurrentYearOnly);
    }, [absences, showCurrentYearOnly]);

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

            <Card className="mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total
                    </CardTitle>
                    <div className="text-4xl font-bold tracking-tight text-primary">
                        {total}
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-4">
                    <div className="flex items-start gap-6">
                        <div className="flex-1">
                            <div className="text-sm font-medium text-muted-foreground">
                                Justifiées
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-green-600">
                                {justified}
                            </div>
                        </div>

                        <div className="h-10 w-px bg-border" />

                        <div className="flex-1">
                            <div className="text-sm font-medium text-muted-foreground">
                                Non-justifiées
                            </div>
                            <div className="mt-1 text-2xl font-semibold text-amber-600">
                                {unjustified}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {absences.length === 0 ? (
                    <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Aucune absence trouvée</AlertTitle>
                    </Alert>
                ) : (
                    absences.map((absence, index) => (
                        <AbsenceCard key={index} absence={absence} />
                    ))
                )}
            </div>
        </main>
    );
}
