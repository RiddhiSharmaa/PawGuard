import { type DogReport } from '@/lib/data'

export type DogCardStatus =
  | 'Reported'
  | 'Being Monitored'
  | 'Rescued'
  | 'Vaccinated'
  | 'Treated'

const DOG_CARD_STATUSES_KEY = 'pawguard-dog-card-statuses'

export const dogCardStatusOptions: DogCardStatus[] = [
  'Reported',
  'Being Monitored',
  'Rescued',
  'Vaccinated',
  'Treated',
]

export function getDefaultDogCardStatus(_dog: DogReport): DogCardStatus {
  return 'Reported'
}

export function getStoredDogCardStatus(dogId: string): DogCardStatus | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(DOG_CARD_STATUSES_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Record<string, DogCardStatus>
    return parsed[dogId] ?? null
  } catch {
    return null
  }
}

export function saveDogCardStatus(dogId: string, status: DogCardStatus) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const raw = window.localStorage.getItem(DOG_CARD_STATUSES_KEY)
    const currentStatuses = raw ? (JSON.parse(raw) as Record<string, DogCardStatus>) : {}
    const nextStatuses = {
      ...currentStatuses,
      [dogId]: status,
    }

    window.localStorage.setItem(DOG_CARD_STATUSES_KEY, JSON.stringify(nextStatuses))
  } catch {
    return
  }
}
