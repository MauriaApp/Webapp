import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import RootLayout from "@/pages/layout"

export default function NotesPage() {
  return (
    <RootLayout>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20">
        {/* Title */}
        <h2 className="text-3xl font-bold text-mauria-light-purple dark:text-white mt-4 mb-6">Notes</h2>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Label htmlFor="current-year" className="text-xl text-mauria-light-purple dark:text-gray-300">
            Année actuelle
          </Label>
          <Switch id="current-year" className="data-[state=checked]:bg-mauria-light-accent" />
        </div>

        {/* Grades List */}
        <div className="space-y-4">
          <GradeCard grade="17.00" course="Evaluation du TP1" coef="1" date="03/01/2023" />

          <GradeCard grade="18.00" course="Partiel de Logique" coef="33" date="16/12/2022" />

          <GradeCard grade="20.00" course="Contrôle Continu de Sciences et société" coef="20" date="15/12/2022" />

          <GradeCard grade="20.00" course="Partiel d'Electromagnétisme" coef="1" date="14/12/2022" />

          <GradeCard grade="20.00" course="Partiel d'Electromagnétisme" coef="100" date="14/12/2022" />
        </div>
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
    <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4">
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

