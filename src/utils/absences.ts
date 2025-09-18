import { parse } from "date-fns"
import { AbsenceData } from "./api"

export const getCurrentYearAbsences = (
  absences: AbsenceData[] | null
): AbsenceData[] | null => {
  if (!absences) return null

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  const start =
    m >= 8
      ? new Date(y, 8, 1, 0, 0, 0, 0)
      : new Date(y - 1, 8, 1, 0, 0, 0, 0)

  const end =
    m >= 8
      ? new Date(y + 1, 7, 31, 23, 59, 59, 999)
      : new Date(y, 7, 31, 23, 59, 59, 999)

  return absences.filter((a) => {
    const d = parseAurionDate(a.date)
    return d >= start && d <= end
  })
}

export const getTotalAbsencesDuration = (
  absences: AbsenceData[] | null,
  thisYear?: boolean
): string => {
  const list = thisYear ? getCurrentYearAbsences(absences) : absences
  if (!list || list.length === 0) return "0h00"

  const { hours, minutes } = sumDurations(list)
  return formatHhMm(hours, minutes)
}

export const getJustifiedAbsencesDuration = (
  absences: AbsenceData[] | null,
  thisYear?: boolean
): string => {
  const list = thisYear ? getCurrentYearAbsences(absences) : absences
  if (!list || list.length === 0) return "0h00"

  const filtered = list.filter((a) => !a.type.includes(" non "))
  const { hours, minutes } = sumDurations(filtered)
  return formatHhMm(hours, minutes)
}

export const getUnjustifiedAbsencesDuration = (
  absences: AbsenceData[] | null,
  thisYear?: boolean
): string => {
  const list = thisYear ? getCurrentYearAbsences(absences) : absences
  if (!list || list.length === 0) return "0h00"

  const filtered = list.filter((a) => a.type.includes(" non "))
  const { hours, minutes } = sumDurations(filtered)
  return formatHhMm(hours, minutes)
}

function parseAurionDate(s: string): Date {
  const cleaned = (s || "").replace(/[-.]/g, "/").trim()

  try {
    const d = parse(cleaned, "dd/MM/yyyy", new Date())
    if (!isNaN(d.getTime())) return d
  } catch {}

  const fallback = new Date(cleaned)
  return isNaN(fallback.getTime()) ? new Date(0) : fallback
}

function sumDurations(list: AbsenceData[]): { hours: number; minutes: number } {
  let h = 0
  let m = 0
  for (const a of list) {
    const [hh, mm] = a.duree.split(":").map((x) => parseInt(x, 10) || 0)
    h += hh
    m += mm
  }
  const carry = Math.floor(m / 60)
  h += carry
  m = m % 60
  return { hours: h, minutes: m }
}

function formatHhMm(hours: number, minutes: number): string {
  return `${hours}h${minutes < 10 ? "0" : ""}${minutes}`
}
