import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DogCard } from '@/components/street-guard/dog-card'
import { mockDogs } from '@/lib/data'

export function RecentRescues() {
  // Show only 3 most recent dogs
  const recentDogs = mockDogs.slice(0, 3)

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

      <div className="grid grid-cols-3 gap-6">
        {recentDogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} />
        ))}
      </div>
    </section>
  )
}
