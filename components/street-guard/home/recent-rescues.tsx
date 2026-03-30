'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { DogCard } from '@/components/street-guard/dog-card'
import { fetchDogs as fetchDogsFromApi } from '@/lib/api'
import { DogReport } from '@/lib/data'

export function RecentRescues() {
  const [recentDogs, setRecentDogs] = useState<DogReport[]>([])

  useEffect(() => {
    const loadDogs = async () => {
      try {
        const dogs = await fetchDogsFromApi()
        setRecentDogs(dogs.slice(0, 3))
      } catch {
        setRecentDogs([])
      }
    }

    loadDogs()
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-10 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)]">
          Recent rescues
        </h2>
        <Link
          href="/feed"
          className="
            flex items-center gap-1 text-[var(--sg-primary)] font-medium
            transition-all duration-200 hover:gap-2
          "
        >
          See all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {recentDogs.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {recentDogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-[var(--sg-neutral-200)] bg-white px-6 py-10 text-center text-[var(--sg-neutral-500)]">
          Recent rescue reports will appear here once the backend is running.
        </div>
      )}
    </section>
  )
}
