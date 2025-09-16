const API_URL = "https://mauriaapi.fly.dev"

export function getSession() {
  const email = localStorage.getItem("email")
  const password = localStorage.getItem("password")

  if (!email || !password) {
    return null
  }

  return { email, password }
}

export function setSession(email: string, password: string) {
  localStorage.setItem("email", email)
  localStorage.setItem("password", password)
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: email,
      password,
    }),
  })

  if (response.status === 302) {
    setSession(email, password)
    await fetchFirstName()
    return true
  }

  return false
}

type PlanningQueryParams = {
  start: string
  end: string
}

export async function fetchPlanning(params?: PlanningQueryParams) {
  const session = getSession()
  if (!session) return null

  const today = new Date()
  const start = params?.start ?? formatDate(today)
  const end = params?.end ?? start

  const response = await fetch(
    `${API_URL}/planning?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: session.email,
        password: session.password,
      }),
    }
  )

  if (response.ok) {
    const data = await response.json()
    localStorage.setItem("lastPlanningUpdate", new Date().toISOString())
    localStorage.setItem("planning", JSON.stringify(data))
    return data
  }

  return null
}

export async function fetchNotes() {
  const session = getSession()
  if (!session) return null

  localStorage.setItem("newNotes", JSON.stringify([]))

  const response = await fetch(`${API_URL}/poststats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: session.email,
      password: session.password,
      shared: "",
    }),
  })

  if (!response.ok) {
    localStorage.setItem("notes", JSON.stringify([]))
    return null
  }

  const data = await response.json()
  const oldNotes = JSON.parse(localStorage.getItem("notes") ?? "[]") as Array<{ code: string }>
  const newNotes = data.filter((note: { code: string }) => !oldNotes.some((old) => old.code === note.code))

  localStorage.setItem("notes", JSON.stringify(data))
  localStorage.setItem("newNotes", JSON.stringify(newNotes))

  return data
}

export async function pushNoteStats() {
  const session = getSession()
  if (!session) return null

  const shared = localStorage.getItem("notesShared") ?? ""

  await fetch(`${API_URL}/poststats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: session.email,
      password: session.password,
      shared,
    }),
  })
}

export async function fetchNoteStats() {
  const session = getSession()
  if (!session) return null

  const response = await fetch(`${API_URL}/getstats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: session.email,
      password: session.password,
    }),
  })

  if (!response.ok) {
    localStorage.setItem("userStats", "null")
    return null
  }

  const data = await response.json()
  localStorage.setItem("userStats", JSON.stringify(data))
  return data
}

export async function fetchAbsences() {
  const session = getSession()
  if (!session) return null

  const response = await fetch(`${API_URL}/absences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: session.email,
      password: session.password,
    }),
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  localStorage.setItem("absences", JSON.stringify(data))
  return data
}

export function getAbsences() {
  const data = localStorage.getItem("absences")
  return data ? JSON.parse(data) : null
}

export async function fetchFirstName() {
  const name = deriveFirstName(localStorage.getItem("email"))
  localStorage.setItem("name", name)
  return name
}

export function getFirstName() {
  return localStorage.getItem("name")
}

function deriveFirstName(email: string | null) {
  if (!email) return ""

  const match = email.match(/^([\w+-]*)([.-])/)
  if (!match) return ""

  return match[1]
    .split(/[-.]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-")
}

export async function fetchAssos() {
  const response = await fetch(`${API_URL}/assos`)

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  localStorage.setItem("associations", JSON.stringify(data))
  return data
}

export async function fetchImportantMessage() {
  const response = await fetch(`${API_URL}/msg`)

  if (!response.ok) {
    return {
      title: "Erreur",
      message: "Une erreur est survenue, rechargez la page plus tard",
    }
  }

  return response.json()
}

export async function fetchEventJunia() {
  const response = await fetch(`${API_URL}/events`)

  if (!response.ok) {
    return []
  }

  return response.json()
}

export async function fetchUpdates() {
  const response = await fetch(`${API_URL}/update`)

  if (!response.ok) {
    localStorage.setItem("updates-log", "[]")
    return null
  }

  const data = await response.json()
  localStorage.setItem("updates-log", JSON.stringify(data))
  return data
}

export async function fetchToolsQuery() {
  try {
    const response = await fetch(`${API_URL}/tools`)

    if (!response.ok) {
      throw new Error("Failed to fetch tools")
    }

    const data = await response.json()
    localStorage.setItem("tools", JSON.stringify(data))
    return data
  } catch {
    try {
      const cached = localStorage.getItem("tools")
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  }
}

export function clearStorage() {
  localStorage.removeItem("email")
  localStorage.removeItem("password")
  localStorage.removeItem("planning")
  localStorage.removeItem("notes")
  localStorage.removeItem("newNotes")
  localStorage.removeItem("userStats")
  localStorage.removeItem("absences")
  localStorage.removeItem("name")
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
