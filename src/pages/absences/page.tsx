import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import RootLayout from "@/pages/layout"


export default function AbsencesPage() {
  return (
    <RootLayout>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20">
        {/* Title */}
        <h2 className="text-3xl font-bold text-mauria-light-purple dark:text-white mt-4 mb-6">Absences</h2>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Label htmlFor="current-year" className="text-xl text-mauria-light-purple dark:text-gray-300">
            Année actuelle
          </Label>
          <Switch id="current-year" />
        </div>

        {/* Absences List */}
        <div className="space-y-4">
          <AbsenceCard
            duration="2h05"
            type="Absence non excusée"
            course="Mathématiques 6 : Analyse avancée"
            time="08:00 - 10:05"
            date="08/11/22"
          />

          <AbsenceCard
            duration="2h05"
            type="Absence non excusée"
            course="Epistémologie"
            time="15:50 - 17:55"
            date="25/04/22"
          />

          <AbsenceCard
            duration="2h00"
            type="Absence non excusée"
            course="Informatique Embarquée"
            time="15:50 - 17:55"
            date="08/04/22"
          />

          <AbsenceCard
            duration="1h00"
            type="Absence excusée sans justificatif"
            course="Electronique Analogique"
            time="11:25 - 12:25"
            date="17/12/21"
            excused
          />

          <AbsenceCard
            duration="1h00"
            type="Absence excusée sans justificatif"
            course="Mathématiques 2 : Analyse"
            time="10:20 - 11:20"
            date="17/12/21"
            excused
          />
        </div>
      </main>

    </RootLayout>
  )
}

function AbsenceCard({
  duration,
  type,
  course,
  time,
  date,
  excused = false,
}: {
  duration: string
  type: string
  course: string
  time: string
  date: string
  excused?: boolean
}) {
  return (
    <Card className="bg-white dark:bg-mauria-dark-card border-none shadow-md p-4">
      <div className="flex">
        <div className="w-20 mr-4">
          <div className="text-2xl font-bold text-mauria-light-accent dark:text-mauria-dark-accent">{duration}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{time}</div>
        </div>
        <div className="flex-1">
          <div
            className={`text-lg font-medium ${excused ? "text-mauria-light-purple" : "text-mauria-light-accent"} dark:text-white`}
          >
            {type}
          </div>
          <div className="text-gray-700 dark:text-gray-300">{course}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{date}</div>
        </div>
      </div>
    </Card>
  )
}

