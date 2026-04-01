'use client'

import { useState, useEffect } from 'react'
import { PawPrint, TriangleAlert } from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'
import { DogCard } from '@/components/street-guard/dog-card'
import { fetchDogs as fetchDogsFromApi } from '@/lib/api'
import { type DogReport } from '@/lib/data'

type FilterType = 'all' | 'urgent' | 'medium' | 'rescued' | 'vaccinated'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'medium', label: 'Medium' },
  { value: 'rescued', label: 'Rescued' },
  { value: 'vaccinated', label: 'Vaccinated' },
]

export default function FeedPage() {
  const [dogs, setDogs] = useState<DogReport[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDogs = async () => {
      try {
        const data = await fetchDogsFromApi()
        setDogs(data)
        setError(null)
      } catch (err) {
        setDogs([])
        setError(err instanceof Error ? err.message : 'Unable to load dog reports right now.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDogs()
  }, [])

  const filteredDogs = dogs.filter((dog) => {
    if (filter === 'all') return true
    if (filter === 'urgent') return dog.priority === 'urgent'
    if (filter === 'medium') return dog.priority === 'medium'
    if (filter === 'rescued') return dog.status === 'rescued' || dog.status === 'rescue_dispatched'
    if (filter === 'vaccinated') return dog.is_vaccinated
    return true
  })

  return (
    <>
      <TopNav />
      <main className="pt-20 pb-10 min-h-screen bg-[var(--sg-neutral-50)]">
        <div className="max-w-7xl mx-auto px-10 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)]">
              Community Feed
            </h1>

            {/* Filter Pills */}
            <div className="flex gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${filter === option.value
                      ? 'bg-[var(--sg-primary)] text-white'
                      : 'bg-white text-[var(--sg-neutral-600)] hover:bg-[var(--sg-neutral-100)] border border-[var(--sg-neutral-200)]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-[var(--sg-neutral-200)]" />
                  <div className="p-4">
                    <div className="h-4 bg-[var(--sg-neutral-200)] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[var(--sg-neutral-200)] rounded w-1/2 mb-4" />
                    <div className="h-4 bg-[var(--sg-neutral-200)] rounded w-full mb-2" />
                    <div className="h-4 bg-[var(--sg-neutral-200)] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <TriangleAlert className="w-16 h-16 text-amber-500 mb-4" />
              <p className="text-[var(--sg-neutral-700)] text-lg mb-2">
                We couldn&apos;t load the live rescue feed.
              </p>
              <p className="text-[var(--sg-neutral-500)] max-w-md">
                {error}
              </p>
            </div>
          ) : filteredDogs.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {filteredDogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <PawPrint className="w-16 h-16 text-[var(--sg-neutral-300)] mb-4" />
              <p className="text-[var(--sg-neutral-500)] text-lg">
                No reports yet. Be the first to help a stray.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
