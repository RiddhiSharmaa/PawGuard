'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, 
  AlertTriangle, 
  Hand, 
  Footprints, 
  Bone,
  User,
  CircleAlert,
  Loader2,
  Phone,
  MapPin,
  CheckCircle
} from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'
import { mockHospitals } from '@/lib/data'

type Step = 1 | 2 | 3 | 'result'

const bodyParts = [
  { id: 'hand', label: 'Hand', icon: Hand },
  { id: 'foot', label: 'Foot', icon: Footprints },
  { id: 'leg', label: 'Leg', icon: Bone },
  { id: 'arm', label: 'Arm', icon: Bone },
  { id: 'face', label: 'Face', icon: User },
  { id: 'other', label: 'Other', icon: CircleAlert },
]

const severityOptions = [
  { id: 'scratch', label: 'Scratch or surface graze', description: 'Minor skin abrasion, no bleeding' },
  { id: 'bleeding', label: 'Broken skin with bleeding', description: 'Visible puncture or tear with blood' },
  { id: 'deep', label: 'Deep wound or multiple bites', description: 'Severe injury requiring immediate attention' },
]

const behaviorOptions = [
  { id: 'foaming', label: 'Foaming at mouth' },
  { id: 'unprovoked', label: 'Unprovoked attack' },
  { id: 'strange', label: 'Behaving strangely' },
  { id: 'unknown', label: 'Unknown' },
]

export default function SOSPage() {
  const [step, setStep] = useState<Step>(1)
  const [biteLocation, setBiteLocation] = useState<string | null>(null)
  const [severity, setSeverity] = useState<string | null>(null)
  const [behaviors, setBehaviors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleBehavior = (id: string) => {
    setBehaviors((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  const handleGetGuidance = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setStep('result')
  }

  const getRiskLevel = () => {
    const hasHighRiskBehavior = behaviors.some(b => ['foaming', 'unprovoked', 'strange'].includes(b))
    const isHighRiskLocation = biteLocation === 'face'
    const isSevere = severity === 'deep'

    if (hasHighRiskBehavior || isHighRiskLocation || isSevere) {
      return 'high'
    }
    if (severity === 'bleeding' || behaviors.includes('unknown')) {
      return 'medium'
    }
    return 'low'
  }

  const resetForm = () => {
    setStep(1)
    setBiteLocation(null)
    setSeverity(null)
    setBehaviors([])
  }

  return (
    <>
      <TopNav />
      <main className="pt-16 min-h-screen bg-[var(--sg-neutral-50)]">
        {/* Red Header Banner */}
        <div className="bg-[var(--sg-urgent)] text-white py-6">
          <div className="max-w-2xl mx-auto px-10">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold">
                Dog Bite SOS
              </h1>
            </div>
            <p className="text-red-100">
              Rabies is fatal once symptoms appear. Act within 24 hours.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-10 py-8">
          {/* Back Button */}
          {step !== 'result' && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[var(--sg-neutral-600)] hover:text-[var(--sg-neutral-800)] transition-colors duration-200 mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Link>
          )}

          {/* Progress Bar */}
          {step !== 'result' && (
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`
                    h-1.5 flex-1 rounded-full transition-colors duration-300
                    ${s <= (step as number) ? 'bg-[var(--sg-urgent)]' : 'bg-[var(--sg-neutral-200)]'}
                  `}
                />
              ))}
            </div>
          )}

          {/* Step 1 - Bite Location */}
          {step === 1 && (
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)] mb-6">
                Where on your body?
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {bodyParts.map((part) => {
                  const Icon = part.icon
                  const isSelected = biteLocation === part.id
                  return (
                    <button
                      key={part.id}
                      onClick={() => setBiteLocation(part.id)}
                      className={`
                        flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-[var(--sg-urgent)] bg-red-50'
                          : 'border-[var(--sg-neutral-200)] bg-white hover:border-[var(--sg-neutral-300)]'
                        }
                      `}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-[var(--sg-urgent)]' : 'text-[var(--sg-neutral-400)]'}`} />
                      <span className={`font-medium ${isSelected ? 'text-[var(--sg-urgent)]' : 'text-[var(--sg-neutral-700)]'}`}>
                        {part.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!biteLocation}
                  className={`
                    px-8 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95
                    ${biteLocation
                      ? 'bg-[var(--sg-urgent)] text-white hover:bg-red-700'
                      : 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-400)] cursor-not-allowed'
                    }
                  `}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Severity */}
          {step === 2 && (
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)] mb-6">
                How serious is the wound?
              </h2>

              <div className="space-y-4 mb-8">
                {severityOptions.map((option) => {
                  const isSelected = severity === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSeverity(option.id)}
                      className={`
                        w-full text-left p-5 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-[var(--sg-urgent)] bg-red-50'
                          : 'border-[var(--sg-neutral-200)] bg-white hover:border-[var(--sg-neutral-300)]'
                        }
                      `}
                    >
                      <div className={`font-semibold mb-1 ${isSelected ? 'text-[var(--sg-urgent)]' : 'text-[var(--sg-neutral-800)]'}`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-[var(--sg-neutral-500)]">
                        {option.description}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-medium text-[var(--sg-neutral-600)] hover:bg-[var(--sg-neutral-100)] transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!severity}
                  className={`
                    px-8 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95
                    ${severity
                      ? 'bg-[var(--sg-urgent)] text-white hover:bg-red-700'
                      : 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-400)] cursor-not-allowed'
                    }
                  `}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Dog Behavior */}
          {step === 3 && (
            <div>
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)] mb-2">
                What was the dog doing?
              </h2>
              <p className="text-[var(--sg-neutral-500)] mb-6">Select all that apply</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {behaviorOptions.map((option) => {
                  const isSelected = behaviors.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleBehavior(option.id)}
                      className={`
                        p-5 rounded-xl border-2 transition-all duration-200
                        ${isSelected
                          ? 'border-[var(--sg-urgent)] bg-red-50'
                          : 'border-[var(--sg-neutral-200)] bg-white hover:border-[var(--sg-neutral-300)]'
                        }
                      `}
                    >
                      <span className={`font-medium ${isSelected ? 'text-[var(--sg-urgent)]' : 'text-[var(--sg-neutral-700)]'}`}>
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl font-medium text-[var(--sg-neutral-600)] hover:bg-[var(--sg-neutral-100)] transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleGetGuidance}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-xl font-semibold bg-[var(--sg-urgent)] text-white hover:bg-red-700 transition-all duration-200 active:scale-95 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get guidance'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {step === 'result' && (
            <div>
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Immediate Steps + Risk */}
                <div>
                  {/* Immediate Steps */}
                  <div className="bg-[var(--sg-urgent)] text-white rounded-2xl p-6 mb-6">
                    <h3 className="font-semibold text-lg mb-4">Do this RIGHT NOW</h3>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                        <span>Wash the wound thoroughly with soap and running water for 15 minutes</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                        <span>Apply antiseptic (povidone-iodine or alcohol) to the wound</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                        <span>Go to the nearest hospital IMMEDIATELY for rabies PEP vaccination</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                        <span>Do NOT apply traditional remedies or cover the wound tightly</span>
                      </li>
                    </ol>
                  </div>

                  {/* Risk Assessment */}
                  {(() => {
                    const risk = getRiskLevel()
                    const riskConfig = {
                      high: { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', label: 'HIGH RISK' },
                      medium: { bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-800', label: 'MODERATE RISK' },
                      low: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', label: 'LOWER RISK' },
                    }
                    const config = riskConfig[risk]
                    return (
                      <div className={`${config.bg} border ${config.border} rounded-2xl p-6`}>
                        <div className={`font-bold text-lg mb-2 ${config.text}`}>{config.label}</div>
                        <p className={`${config.text} opacity-80`}>
                          {risk === 'high' && 'Based on your responses, you should seek medical attention immediately. Rabies vaccination is critical.'}
                          {risk === 'medium' && 'You should see a doctor within 24 hours. Rabies vaccination is strongly recommended as a precaution.'}
                          {risk === 'low' && 'While the risk appears lower, we still recommend seeing a doctor. Rabies is 100% fatal once symptoms appear.'}
                        </p>
                      </div>
                    )
                  })()}
                </div>

                {/* Right Column - Hospitals */}
                <div>
                  <h3 className="font-semibold text-[var(--sg-neutral-800)] mb-4">Nearest Hospitals</h3>
                  <div className="space-y-4">
                    {mockHospitals.slice(0, 2).map((hospital) => (
                      <div key={hospital.name} className="bg-white rounded-xl p-5 border border-[var(--sg-neutral-200)]">
                        <div className="font-semibold text-[var(--sg-neutral-800)] mb-1">
                          {hospital.name}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-[var(--sg-neutral-500)] mb-3">
                          <MapPin className="w-4 h-4" />
                          {hospital.address} · {hospital.distance}
                        </div>
                        <div className="flex gap-3">
                          <a
                            href={`tel:${hospital.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-[var(--sg-urgent)] text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all duration-200 active:scale-95"
                          >
                            <Phone className="w-4 h-4" />
                            Call Now
                          </a>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 border-2 border-[var(--sg-neutral-200)] text-[var(--sg-neutral-700)] font-semibold px-4 py-2.5 rounded-xl hover:bg-[var(--sg-neutral-50)] transition-all duration-200 active:scale-95"
                          >
                            <MapPin className="w-4 h-4" />
                            Directions
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Report Another */}
                  <button
                    onClick={resetForm}
                    className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-[var(--sg-primary)] text-[var(--sg-primary)] font-semibold px-6 py-3 rounded-xl hover:bg-[var(--sg-primary-light)] transition-all duration-200 active:scale-95"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Start Over
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-sm text-[var(--sg-neutral-400)] mt-8">
                This guidance is for informational purposes only and does not replace professional medical advice. Always consult a healthcare provider for dog bite injuries.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
