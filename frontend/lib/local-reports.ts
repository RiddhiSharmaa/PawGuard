import { type DogPriority, type DogReport } from '@/lib/data'

const LOCAL_REPORTS_KEY = 'pawguard-local-reports'

type SaveLocalReportInput = {
  imageUrl: string
  latitude: number
  longitude: number
  locationAddress: string
  description: string
  phoneNumber: string
  urgency: DogPriority
  isInjured: boolean
  ngoName?: string | null
  rescueNeeded?: boolean
}

export function getLocalReports(): DogReport[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_REPORTS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DogReport[]) : []
  } catch {
    return []
  }
}

export function saveLocalReport(input: SaveLocalReportInput): DogReport {
  const newReport: DogReport = {
    id: `local-${Date.now()}`,
    image_url: input.imageUrl,
    latitude: input.latitude,
    longitude: input.longitude,
    location_address: input.locationAddress,
    priority: input.urgency,
    is_injured: input.isInjured,
    is_aggressive: false,
    condition: input.description,
    estimated_age: 'unknown',
    status: input.ngoName ? 'rescue_dispatched' : 'reported',
    ngo_name: input.ngoName ?? null,
    reported_at: new Date().toISOString(),
    is_vaccinated: false,
    description: input.description,
    phone_number: input.phoneNumber,
    rescue_needed: input.rescueNeeded ?? true,
  }

  const reports = [newReport, ...getLocalReports()]
  window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports))
  return newReport
}
