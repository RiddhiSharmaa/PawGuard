'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Ambulance, 
  Syringe,
  Plus,
  Loader2
} from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'
import { PriorityBadge } from '@/components/street-guard/priority-badge'
import { type DogReport, mockDogs, getTimeAgo } from '@/lib/data'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import('@/components/street-guard/map/map-container'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[var(--sg-neutral-100)]">
        <Loader2 className="w-8 h-8 text-[var(--sg-primary)] animate-spin" />
      </div>
    )
  }
)

type FilterType = 'all' | 'urgent' | 'medium' | 'rescued'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'medium', label: 'Medium' },
  { value: 'rescued', label: 'Rescued' },
]

export default function MapPage() {
  const [dogs, setDogs] = useState<DogReport[]>(mockDogs)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedDog, setSelectedDog] = useState<DogReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const fetchDogs = async () => {
      try {
        // In production, this would be: const res = await fetch('http://localhost:8000/dogs')
        await new Promise(resolve => setTimeout(resolve, 500))
        setDogs(mockDogs)
      } catch {
        // Fallback to mock data
        setDogs(mockDogs)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDogs()

    // Refresh every 30 seconds
    const interval = setInterval(fetchDogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredDogs = dogs.filter((dog) => {
    if (filter === 'all') return true
    if (filter === 'urgent') return dog.priority === 'urgent'
    if (filter === 'medium') return dog.priority === 'medium'
    if (filter === 'rescued') return dog.status === 'rescued'
    return true
  })

  const handleMarkerClick = (dog: DogReport) => {
    setSelectedDog(dog)
  }

  const handleBackToList = () => {
    setSelectedDog(null)
  }

  return (
    <>
      <TopNav />
      <div className="pt-16 h-screen flex">
        {/* Left Sidebar */}
        <aside className="w-[360px] bg-white shadow-md flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[var(--sg-neutral-200)]">
            {selectedDog ? (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1 text-[var(--sg-neutral-600)] hover:text-[var(--sg-neutral-800)] transition-colors duration-200 mb-4"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to list
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)]">
                    Live Rescue Map
                  </h1>
                  <span className="px-2 py-1 bg-[var(--sg-primary-light)] text-[var(--sg-primary)] text-sm font-semibold rounded-full">
                    {filteredDogs.length}
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`
                        px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                        ${filter === option.value
                          ? 'bg-[var(--sg-primary)] text-white'
                          : 'bg-[var(--sg-neutral-100)] text-[var(--sg-neutral-600)] hover:bg-[var(--sg-neutral-200)]'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-[var(--sg-primary)] animate-spin" />
              </div>
            ) : selectedDog ? (
              /* Selected Dog Detail */
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden bg-[var(--sg-neutral-100)] mb-4">
                  <Image
                    src={selectedDog.image_url}
                    alt={`Dog at ${selectedDog.location_address}`}
                    fill
                    className="object-cover"
                    sizes="360px"
                  />
                </div>

                <div className="mb-4">
                  <PriorityBadge priority={selectedDog.priority} size="lg" />
                </div>

                <p className="text-[var(--sg-neutral-800)] leading-relaxed mb-4">
                  {selectedDog.condition}
                </p>

                <div className="flex items-center gap-1.5 text-[var(--sg-neutral-600)] text-sm mb-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Reported {getTimeAgo(selectedDog.reported_at)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--sg-neutral-600)] text-sm mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{selectedDog.location_address}</span>
                </div>

                {/* Status */}
                {selectedDog.status === 'rescue_dispatched' && selectedDog.ngo_name && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-3">
                    <Ambulance className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Rescue dispatched by {selectedDog.ngo_name}</span>
                  </div>
                )}

                {selectedDog.status === 'rescued' && selectedDog.ngo_name && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-3">
                    <Ambulance className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Rescued by {selectedDog.ngo_name}</span>
                  </div>
                )}

                {selectedDog.is_vaccinated && (
                  <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Syringe className="w-4 h-4" />
                    Vaccinated
                  </div>
                )}
              </div>
            ) : (
              /* Dog List */
              <div className="space-y-4">
                {filteredDogs.map((dog) => (
                  <DogListItem
                    key={dog.id}
                    dog={dog}
                    onClick={() => handleMarkerClick(dog)}
                  />
                ))}

                {filteredDogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[var(--sg-neutral-400)]">No reports found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report Button */}
          <div className="p-4 border-t border-[var(--sg-neutral-200)]">
            <Link
              href="/report"
              className="
                w-full flex items-center justify-center gap-2
                bg-[var(--sg-primary)] text-white font-semibold
                px-6 py-3 rounded-xl
                transition-all duration-200
                hover:bg-[var(--sg-primary-dark)]
                active:scale-95
              "
            >
              <Plus className="w-5 h-5" />
              Report a Dog
            </Link>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 h-full">
          <MapComponent
            dogs={filteredDogs}
            selectedDog={selectedDog}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </>
  )
}

function DogListItem({ dog, onClick }: { dog: DogReport; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full text-left bg-white rounded-xl p-3 border border-[var(--sg-neutral-200)]
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--sg-primary)]/30
      "
    >
      <div className="flex gap-3">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--sg-neutral-100)] flex-shrink-0">
          <Image
            src={dog.image_url}
            alt={`Dog at ${dog.location_address}`}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={dog.priority} size="sm" />
          </div>
          <p className="text-sm text-[var(--sg-neutral-800)] line-clamp-2 mb-1">
            {dog.condition}
          </p>
          <p className="text-xs text-[var(--sg-neutral-400)]">
            {getTimeAgo(dog.reported_at)}
          </p>
        </div>
      </div>
    </button>
  )
}
