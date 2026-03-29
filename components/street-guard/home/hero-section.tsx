import Image from 'next/image'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-10 py-16">
      <div className="flex items-center gap-16">
        {/* Left Column - Text + Buttons */}
        <div className="flex-1">
          <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-[var(--sg-neutral-900)] leading-tight mb-6">
            Every stray deserves a chance at safety.
          </h1>
          <p className="text-lg text-[var(--sg-neutral-600)] mb-8 max-w-lg">
            Spot a dog in distress? Report it in seconds. Our AI notifies the nearest rescue NGO instantly.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/report"
              className="
                bg-[var(--sg-primary)] text-white font-semibold
                px-8 py-3 rounded-xl
                transition-all duration-200
                hover:bg-[var(--sg-primary-dark)]
                active:scale-95
              "
            >
              Report a Dog
            </Link>
            <Link
              href="/sos"
              className="
                border-2 border-[var(--sg-urgent)] text-[var(--sg-urgent)] font-semibold
                bg-white px-8 py-3 rounded-xl
                transition-all duration-200
                hover:bg-red-50
                active:scale-95
              "
            >
              Dog Bite SOS
            </Link>
          </div>

          {/* Stats */}
          <p className="text-sm text-[var(--sg-neutral-400)]">
            2,341 dogs rescued · 47 NGOs · 12 cities
          </p>
        </div>

        {/* Right Column - Hero Image */}
        <div className="flex-1">
          <div className="relative h-96 rounded-2xl overflow-hidden bg-[var(--sg-neutral-100)]">
            <Image
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"
              alt="Two happy dogs running together after being rescued"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 50vw, 600px"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
