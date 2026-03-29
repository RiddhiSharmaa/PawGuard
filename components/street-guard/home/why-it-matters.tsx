export function WhyItMatters() {
  return (
    <section className="bg-[var(--sg-primary-light)] py-16">
      <div className="max-w-7xl mx-auto px-10">
        <div className="flex items-start gap-16">
          {/* Left Column - Main Stat */}
          <div className="flex-1">
            <div className="text-6xl font-bold text-[var(--sg-primary)] mb-4 font-[family-name:var(--font-fraunces)]">
              20,000+
            </div>
            <p className="text-xl text-[var(--sg-neutral-800)] font-medium mb-4">
              Stray dogs in Delhi alone need immediate help
            </p>
            <p className="text-[var(--sg-neutral-600)] leading-relaxed max-w-md">
              {"India's Animal Birth Control (ABC) program struggles to keep pace with the growing stray population. StreetGuard bridges the gap between citizens who spot animals in distress and the NGOs equipped to help them."}
            </p>
          </div>

          {/* Right Column - Supporting Stats */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[var(--sg-urgent)] mb-1 font-[family-name:var(--font-fraunces)]">
                17,000+
              </div>
              <p className="text-[var(--sg-neutral-600)]">
                Dog bite cases reported annually in Delhi
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[var(--sg-medium)] mb-1 font-[family-name:var(--font-fraunces)]">
                62%
              </div>
              <p className="text-[var(--sg-neutral-600)]">
                Of strays remain unvaccinated against rabies
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-[var(--sg-low)] mb-1 font-[family-name:var(--font-fraunces)]">
                47
              </div>
              <p className="text-[var(--sg-neutral-600)]">
                Active NGOs partnered but understaffed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
