"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import RootLayout from "@/pages/layout";
import {
    getCurrentYearAbsences,
    getJustifiedAbsencesDuration,
    getTotalAbsencesDuration,
    getUnjustifiedAbsencesDuration,
} from "@/utils/absences";
import { AbsenceData, fetchAbsences } from "@/utils/api";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { mockAbsences } from "../mock";

function dateKey(s: string): number {
    const parts = (s || "")
        .trim()
        .split(/[/.:-]/)
        .map((x) => parseInt(x, 10));
    const d = parts[0] || 1;
    const m = (parts[1] || 1) - 1;
    const y = parts[2] || 1970;
    return new Date(y, m, d).getTime();
}

export default function AbsencesPage() {
  const [onlyThisYear, setOnlyThisYear] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [, setLoading] = useState(false)
  const [, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchAbsences()
      .catch(() => {})
      .finally(() => {
        setLastUpdated(new Date())
        setRefreshKey((k) => k + 1)
        setLoading(false)
      })
  }, [])

      // const allAbsences = useMemo<AbsenceData[] | null>(() => {
    //     return getAbsences() as AbsenceData[] | null;
    // }, [refreshKey]);
    const allAbsences = mockAbsences.data as AbsenceData[];

  const list = useMemo<AbsenceData[]>(() => {
    const base = onlyThisYear ? getCurrentYearAbsences(allAbsences) : allAbsences
    const arr = base ?? []
    return arr.slice().sort((a, b) => dateKey(b.date) - dateKey(a.date))
  }, [allAbsences, onlyThisYear])

  const total = useMemo(
    () => getTotalAbsencesDuration(allAbsences, onlyThisYear),
    [allAbsences, onlyThisYear]
  )
  const justified = useMemo(
    () => getJustifiedAbsencesDuration(allAbsences, onlyThisYear),
    [allAbsences, onlyThisYear]
  )
  const unjustified = useMemo(
    () => getUnjustifiedAbsencesDuration(allAbsences, onlyThisYear),
    [allAbsences, onlyThisYear]
  )

  return (
    <RootLayout>
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Switch id="onlyThisYear" checked={onlyThisYear} onCheckedChange={setOnlyThisYear} />
          <Label htmlFor="onlyThisYear">Afficher uniquement cette année</Label>
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
                    {list.length === 0 ? (
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Aucune absence trouvée</AlertTitle>
                        </Alert>
                    ) : (
                        list.map((a, i) => {
                            const key = (a as any).id ?? `${a.date ?? ""}-${i}`;
                            return (
                                <AbsenceCard
                                    key={key}
                                    duration={
                                        (a as any).duration ??
                                        (a as any).length ??
                                        ""
                                    }
                                    type={
                                        (a as any).type ??
                                        ((a as any).justified
                                            ? "Absence excusée"
                                            : "Absence non excusée")
                                    }
                                    course={
                                        (a as any).course ??
                                        (a as any).subject ??
                                        (a as any).module ??
                                        ""
                                    }
                                    time={
                                        (a as any).time ??
                                        ((a as any).start && (a as any).end
                                            ? `${(a as any).start} - ${
                                                  (a as any).end
                                              }`
                                            : "")
                                    }
                                    date={
                                        (a as any).date ?? (a as any).day ?? ""
                                    }
                                    excused={
                                        !!(
                                            (a as any).excused ??
                                            (a as any).justified
                                        )
                                    }
                                />
                            );
                        })
                    )}
                </div>
            </main>
        </RootLayout>
    );
}

function AbsenceCard({
    duration,
    type,
    course,
    time,
    date,
    excused = false,
}: {
    duration: string;
    type: string;
    course: string;
    time: string;
    date: string;
    excused?: boolean;
}) {
    return (
        <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4">
            <div className="flex">
                <div className="w-20 mr-4">
                    <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">
                        {duration}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {time}
                    </div>
                </div>
                <div className="flex-1">
                    <div
                        className={`text-lg font-medium ${
                            excused
                                ? "text-mauria-light-purple"
                                : "text-mauria-light-accent"
                        } dark:text-white`}
                    >
                        {type}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        {course}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {date}
                    </div>
                </div>
            </div>
        </Card>
    );
}
