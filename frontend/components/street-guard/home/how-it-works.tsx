import { Camera, Cpu, Truck } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'You photograph the dog',
    description: 'Spot a stray in distress. Take a photo and drop a pin.',
  },
  {
    icon: Cpu,
    title: 'AI assesses instantly',
    description: 'Claude AI analyzes injury severity and rescue urgency.',
  },
  {
    icon: Truck,
    title: 'NGO is notified',
    description: 'The nearest rescue organization gets an auto-drafted alert and dispatches help.',
  },
]

export function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-10 py-16">
      <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)] text-center mb-12">
        How it works
      </h2>

      <div className="grid grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="
              bg-white rounded-2xl shadow-sm p-6
              border-l-4 border-[var(--sg-primary)]
              transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-md
            "
          >
            <step.icon className="w-10 h-10 text-[var(--sg-primary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--sg-neutral-800)] mb-2">
              {step.title}
            </h3>
            <p className="text-[var(--sg-neutral-600)] text-[15px] leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
