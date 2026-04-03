import { DogReport, ReportResult, SOSGuidance } from '@/lib/data'

type BackendDog = {
  id: string
  image_url?: string | null
  latitude: number
  longitude: number
  location_address?: string | null
  priority?: 'urgent' | 'medium' | 'low' | null
  is_injured?: boolean | null
  is_aggressive?: boolean | null
  condition?: string | null
  estimated_age?: string | null
  status?: 'processing' | 'reported' | 'monitoring' | 'rescue_dispatched' | 'rescued' | null
  ngo_name?: string | null
  reported_at?: string | null
  rescue_needed?: boolean | null
  description?: string | null
  phone_number?: string | null
}

type SubmitReportInput = {
  image: File
  latitude: number
  longitude: number
  address: string
  description: string
}

type SOSInput = {
  bite_location: string
  severity: string
  symptoms: string[]
  lat?: number
  lng?: number
}

function normalizeImageUrl(imageUrl?: string | null): string {
  const trimmed = imageUrl?.trim()
  return trimmed ? trimmed : '/placeholder.svg'
}

function normalizeDog(dog: BackendDog): DogReport {
  return {
    id: dog.id,
    image_url: normalizeImageUrl(dog.image_url),
    latitude: dog.latitude,
    longitude: dog.longitude,
    location_address: dog.location_address || 'Location unavailable',
    priority: dog.priority || 'medium',
    is_injured: Boolean(dog.is_injured),
    is_aggressive: Boolean(dog.is_aggressive),
    condition: dog.condition || dog.description || 'Assessment in progress',
    estimated_age: dog.estimated_age || 'unknown',
    status: dog.status || 'reported',
    ngo_name: dog.ngo_name || null,
    reported_at: dog.reported_at || new Date().toISOString(),
    is_vaccinated: false,
    description: dog.description || undefined,
    phone_number: dog.phone_number || undefined,
    rescue_needed: Boolean(dog.rescue_needed),
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message
  } catch {
    return 'Something went wrong while talking to the backend.'
  }

  return 'Something went wrong while talking to the backend.'
}

export async function fetchDogs(): Promise<DogReport[]> {
  const response = await fetch('/api/dogs', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const dogs = (await response.json()) as BackendDog[]
  return dogs.map(normalizeDog)
}

export async function submitReport(input: SubmitReportInput): Promise<ReportResult> {
  const formData = new FormData()
  formData.append('image', input.image)
  formData.append('latitude', String(input.latitude))
  formData.append('longitude', String(input.longitude))
  formData.append('address', input.address)
  formData.append('description', input.description)

  const response = await fetch('/api/report', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const result = (await response.json()) as ReportResult
  return {
    possible_ngos: [],
    status_updates: [],
    ...result,
  }
}

export async function requestSOSGuidance(input: SOSInput): Promise<SOSGuidance> {
  const response = await fetch('/api/sos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as SOSGuidance
}
