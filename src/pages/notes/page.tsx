"use client"

import { useEffect, useMemo, useState } from "react"
import RootLayout from "@/pages/layout"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { fetchNotes } from "@/utils/api"
import { mergeNotesData } from "@/utils/notes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function NotesPage() {
  const now = new Date()
  let currentYear = now.getFullYear()
  const month = now.getMonth() + 1
  if (month >= 9) currentYear++

  const [onlyThisYear, setOnlyThisYear] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchNotes().finally(() => setRefreshKey((k) => k + 1))
  }, [])

  const merged = useMemo(
    () => mergeNotesData(onlyThisYear, currentYear),
    [onlyThisYear, currentYear, refreshKey]
  )

  return (
    <RootLayout>
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Switch id="onlyThisYear" checked={onlyThisYear} onCheckedChange={setOnlyThisYear} />
          <Label htmlFor="onlyThisYear">Afficher uniquement cette année</Label>
        </div>

        {merged.length === 0 ? (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Aucune note pour l'instant</AlertTitle>
          </Alert>
        ) : (
          <div className="space-y-2">
            {merged.map(({ note }) => (
              <GradeCard
                key={(note as any).code}
                grade={(note as any).grade}
                course={(note as any).course}
                coef={(note as any).coef}
                date={(note as any).date}
              />
            ))}
          </div>
        )}
      </main>
    </RootLayout>
  )
}

function GradeCard({
  grade,
  course,
  coef,
  date,
}: {
  grade: string
  course: string
  coef: string
  date: string
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-20 mr-4">
          <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">{grade}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Coef {coef}</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-medium text-mauria-light-purple dark:text-white">{course}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{date}</div>
        </div>
      </div>
    </Card>
  )
}
