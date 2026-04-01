export type DogPriority = 'urgent' | 'medium' | 'low'

export type DogStatus =
  | 'processing'
  | 'reported'
  | 'monitoring'
  | 'rescue_dispatched'
  | 'rescued'

export interface DogReport {
  id: string
  image_url: string
  latitude: number
  longitude: number
  location_address: string
  priority: DogPriority
  is_injured: boolean
  is_aggressive?: boolean
  condition: string
  estimated_age: string
  status: DogStatus
  ngo_name: string | null
  reported_at: string
  is_vaccinated: boolean
  description?: string
  rescue_needed?: boolean
}

export interface SOSGuidance {
  risk_level: 'high' | 'medium' | 'low'
  risk_explanation: string
  immediate_steps: string[]
  seek_care_urgency: 'immediately' | 'within 24 hours' | 'within 72 hours' | 'monitor at home'
  pep_recommended: boolean
}

export interface ReportAssessment {
  priority: DogPriority
  priority_reason: string
  is_injured: boolean
  is_aggressive: boolean
  estimated_age: string
  injury_description?: string | null
  body_condition_label?: string | null
  visible_conditions: string[]
  rescue_needed: boolean
  triage_reasoning: string
}

export interface ReportResult {
  dog_id: string
  status: 'success' | 'duplicate'
  assessment: ReportAssessment
  rescue_dispatched: boolean
  ngo_name: string
  is_duplicate: boolean
  possible_ngos?: Array<{
    name: string
    email?: string
    phone?: string
    specialization?: string
    distance_km?: number | null
    coverage_area?: string
  }>
  status_updates?: string[]
  agent_reasoning: Record<string, unknown>
}

export interface Hospital {
  name: string
  address: string
  phone: string
  distance: string
}

export const mockDogs: DogReport[] = [
  {
    id: "1",
    image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    latitude: 28.6328, 
    longitude: 77.2197,
    location_address: "Near Connaught Place Metro, New Delhi",
    priority: "urgent",
    is_injured: true,
    condition: "Severe leg injury, unable to walk, likely hit by vehicle",
    estimated_age: "adult",
    status: "rescue_dispatched",
    ngo_name: "Friendicoes SECA",
    reported_at: new Date(Date.now() - 12 * 60000).toISOString(),
    is_vaccinated: false
  },
  {
    id: "2",
    image_url: "https://images.unsplash.com/photo-1534361960057-19f4434d01e1?w=400",
    latitude: 28.5921, 
    longitude: 77.2291,
    location_address: "Lajpat Nagar Market, New Delhi",
    priority: "medium",
    is_injured: false,
    condition: "Severe mange, malnourished, needs medical attention",
    estimated_age: "young",
    status: "reported",
    ngo_name: null,
    reported_at: new Date(Date.now() - 34 * 60000).toISOString(),
    is_vaccinated: true
  },
  {
    id: "3",
    image_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
    latitude: 28.6517, 
    longitude: 77.2219,
    location_address: "Civil Lines, New Delhi",
    priority: "low",
    is_injured: false,
    condition: "Healthy but abandoned, young puppy alone, no mother visible",
    estimated_age: "puppy",
    status: "rescued",
    ngo_name: "Jeev Ashram",
    reported_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    is_vaccinated: false
  },
  {
    id: "4",
    image_url: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400",
    latitude: 28.6129, 
    longitude: 77.2295,
    location_address: "India Gate, New Delhi",
    priority: "urgent",
    is_injured: true,
    condition: "Deep wound on neck, possibly from wire entanglement, bleeding",
    estimated_age: "adult",
    status: "rescue_dispatched",
    ngo_name: "People For Animals",
    reported_at: new Date(Date.now() - 8 * 60000).toISOString(),
    is_vaccinated: false
  },
  {
    id: "5",
    image_url: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",
    latitude: 28.6562, 
    longitude: 77.2410,
    location_address: "Kashmere Gate, New Delhi",
    priority: "medium",
    is_injured: false,
    condition: "Emaciated, ribs visible, needs feeding and medical checkup",
    estimated_age: "senior",
    status: "reported",
    ngo_name: null,
    reported_at: new Date(Date.now() - 45 * 60000).toISOString(),
    is_vaccinated: true
  },
  {
    id: "6",
    image_url: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400",
    latitude: 28.5494, 
    longitude: 77.2001,
    location_address: "Saket Metro Station, New Delhi",
    priority: "low",
    is_injured: false,
    condition: "Stray puppy, appears healthy but alone, needs shelter",
    estimated_age: "puppy",
    status: "rescued",
    ngo_name: "Sanjay Gandhi Animal Care Centre",
    reported_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    is_vaccinated: true
  }
]

export const mockHospitals: Hospital[] = [
  { 
    name: "AIIMS Emergency", 
    address: "Ansari Nagar, New Delhi", 
    phone: "011-26588500", 
    distance: "2.3 km" 
  },
  { 
    name: "Safdarjung Hospital", 
    address: "Ansari Nagar West, New Delhi", 
    phone: "011-26730000", 
    distance: "3.1 km" 
  },
  { 
    name: "RML Hospital", 
    address: "Baba Kharak Singh Marg, New Delhi", 
    phone: "011-23365525", 
    distance: "4.7 km" 
  }
]

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}
