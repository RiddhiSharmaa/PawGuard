'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ChevronLeft, 
  Camera, 
  X, 
  MapPin, 
  Check,
  Loader2,
  CheckCircle,
  AlertCircle,
  Map
} from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'
import { PriorityBadge } from '@/components/street-guard/priority-badge'

interface Assessment {
  priority: 'urgent' | 'medium' | 'low'
  priority_reason: string
  is_injured: boolean
  is_aggressive: boolean
  estimated_age: string
  condition: string
  rescue_needed: boolean
}

interface ReportResult {
  dog_id: string
  status: 'success' | 'duplicate'
  assessment: Assessment
  rescue_dispatched: boolean
  ngo_name: string
}

const processingMessages = [
  'Analyzing the image with AI...',
  'Assessing injury severity...',
  'Finding nearest rescue NGO...',
  'Sending rescue alert...',
]

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [image, setImage] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [locationDetected, setLocationDetected] = useState(false)
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0)
  const [result, setResult] = useState<ReportResult | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImage(null)
  }

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationDetected(true)
        },
        () => {
          alert('Unable to detect location. Please enter an address manually.')
        }
      )
    }
  }

  const handleSubmit = async () => {
    setStep(3)
    
    // Simulate processing with rotating messages
    const messageInterval = setInterval(() => {
      setProcessingMessageIndex((prev) => (prev + 1) % processingMessages.length)
    }, 2000)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 6000))
    
    clearInterval(messageInterval)

    // Mock result
    const mockResult: ReportResult = {
      dog_id: 'dog_' + Math.random().toString(36).substr(2, 9),
      status: 'success',
      assessment: {
        priority: 'urgent',
        priority_reason: 'Visible injury requiring immediate attention',
        is_injured: true,
        is_aggressive: false,
        estimated_age: 'adult',
        condition: description || 'Dog appears to be in distress with visible injuries. Immediate rescue recommended.',
        rescue_needed: true,
      },
      rescue_dispatched: true,
      ngo_name: 'Friendicoes SECA',
    }

    setResult(mockResult)
    setStep(4)
  }

  const resetForm = () => {
    setStep(1)
    setImage(null)
    setDescription('')
    setLocation(null)
    setAddress('')
    setLocationDetected(false)
    setResult(null)
    setProcessingMessageIndex(0)
  }

  return (
    <>
      <TopNav />
      <main className="pt-20 pb-10 min-h-screen bg-[var(--sg-neutral-50)]">
        <div className="max-w-2xl mx-auto px-10 py-8">
          {/* Back Button */}
          {step < 3 && (
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[var(--sg-neutral-600)] hover:text-[var(--sg-neutral-800)] transition-colors duration-200 mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Link>
          )}

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`
                  h-1.5 flex-1 rounded-full transition-colors duration-300
                  ${s <= step ? 'bg-[var(--sg-primary)]' : 'bg-[var(--sg-neutral-200)]'}
                `}
              />
            ))}
          </div>

          {/* Step 1 - Capture */}
          {step === 1 && (
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)] mb-2">
                Photograph the dog
              </h1>
              <p className="text-[var(--sg-neutral-600)] mb-8">
                Take a clear photo showing the dog&apos;s condition
              </p>

              <div className="grid grid-cols-2 gap-6">
                {/* Upload Area */}
                <div>
                  {!image ? (
                    <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--sg-neutral-300)] rounded-2xl cursor-pointer hover:border-[var(--sg-primary)] hover:bg-[var(--sg-primary-light)]/30 transition-all duration-200">
                      <Camera className="w-12 h-12 text-[var(--sg-neutral-400)] mb-3" />
                      <span className="text-[var(--sg-neutral-600)] font-medium">
                        Click to upload a photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  ) : (
                    <div className="relative h-64 rounded-2xl overflow-hidden bg-[var(--sg-neutral-100)]">
                      <Image
                        src={image}
                        alt="Uploaded dog"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--sg-neutral-700)] mb-2">
                    Describe what you see
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dog is limping badly near the gate, appears to have been hit by a vehicle"
                    className="w-full h-56 px-4 py-3 rounded-xl border border-[var(--sg-neutral-200)] focus:border-[var(--sg-primary)] focus:ring-2 focus:ring-[var(--sg-primary)]/20 outline-none resize-none text-[var(--sg-neutral-800)] placeholder:text-[var(--sg-neutral-400)] transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={!image}
                  className={`
                    px-8 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95
                    ${image
                      ? 'bg-[var(--sg-primary)] text-white hover:bg-[var(--sg-primary-dark)]'
                      : 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-400)] cursor-not-allowed'
                    }
                  `}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Location */}
          {step === 2 && (
            <div>
              <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)] mb-2">
                Where is the dog?
              </h1>
              <p className="text-[var(--sg-neutral-600)] mb-8">
                Help us locate the dog for rescue
              </p>

              <div className="grid grid-cols-2 gap-6">
                {/* Location Input */}
                <div>
                  <button
                    onClick={detectLocation}
                    className={`
                      w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 mb-4
                      ${locationDetected
                        ? 'bg-green-100 text-green-700 border-2 border-green-200'
                        : 'bg-[var(--sg-primary)] text-white hover:bg-[var(--sg-primary-dark)]'
                      }
                    `}
                  >
                    {locationDetected ? (
                      <>
                        <Check className="w-5 h-5" />
                        Location detected
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        Detect my location
                      </>
                    )}
                  </button>

                  {locationDetected && location && (
                    <p className="text-sm text-[var(--sg-neutral-500)] mb-4">
                      Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  )}

                  <div className="relative">
                    <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                      <span className="bg-[var(--sg-neutral-50)] px-3 text-sm text-[var(--sg-neutral-400)]">
                        Or enter an address
                      </span>
                    </div>
                    <div className="border-t border-[var(--sg-neutral-200)] pt-6 mt-3">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Near Gate 3, Lajpat Nagar Market"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--sg-neutral-200)] focus:border-[var(--sg-primary)] focus:ring-2 focus:ring-[var(--sg-primary)]/20 outline-none text-[var(--sg-neutral-800)] placeholder:text-[var(--sg-neutral-400)] transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="h-64 rounded-2xl overflow-hidden bg-[var(--sg-neutral-100)]">
                  {location ? (
                    <Image
                      src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+EA6C1E(${location.lng},${location.lat})/${location.lng},${location.lat},14,0/400x256@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                      alt="Map preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--sg-neutral-400)]">
                      <Map className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm">Map preview will appear here</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-medium text-[var(--sg-neutral-600)] hover:bg-[var(--sg-neutral-100)] transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!locationDetected && !address}
                  className={`
                    px-8 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95
                    ${locationDetected || address
                      ? 'bg-[var(--sg-primary)] text-white hover:bg-[var(--sg-primary-dark)]'
                      : 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-400)] cursor-not-allowed'
                    }
                  `}
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Processing */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-16 h-16 text-[var(--sg-primary)] animate-spin mb-6" />
              <p className="text-lg text-[var(--sg-neutral-700)] animate-pulse">
                {processingMessages[processingMessageIndex]}
              </p>
            </div>
          )}

          {/* Step 4 - Result */}
          {step === 4 && result && (
            <div>
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Assessment */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-16 h-16 text-green-500 animate-[scale-in_0.3s_ease-out]" />
                    ) : (
                      <AlertCircle className="w-16 h-16 text-blue-500" />
                    )}
                  </div>

                  <div className="mb-4">
                    <PriorityBadge priority={result.assessment.priority} size="lg" />
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold text-[var(--sg-neutral-800)] mb-4">
                      Assessment Details
                    </h3>
                    <p className="text-[var(--sg-neutral-600)] mb-4 leading-relaxed">
                      {result.assessment.condition}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.assessment.is_injured && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          Injured
                        </span>
                      )}
                      {result.assessment.is_aggressive && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          May be aggressive
                        </span>
                      )}
                      <span className="px-3 py-1 bg-[var(--sg-neutral-100)] text-[var(--sg-neutral-600)] rounded-full text-sm font-medium capitalize">
                        {result.assessment.estimated_age}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Status */}
                <div>
                  {result.rescue_dispatched && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <CheckCircle className="w-5 h-5" />
                        Rescue Dispatched
                      </div>
                      <p className="text-green-600">
                        {result.ngo_name} has been notified and is dispatching rescue to the location.
                      </p>
                    </div>
                  )}

                  {result.status === 'duplicate' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                        <AlertCircle className="w-5 h-5" />
                        Already Reported
                      </div>
                      <p className="text-blue-600">
                        This dog was already reported nearby. Rescue is on the way.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={resetForm}
                      className="w-full px-6 py-3 rounded-xl font-semibold border-2 border-[var(--sg-primary)] text-[var(--sg-primary)] hover:bg-[var(--sg-primary-light)] transition-all duration-200 active:scale-95"
                    >
                      Report Another Dog
                    </button>
                    <Link
                      href="/map"
                      className="w-full px-6 py-3 rounded-xl font-semibold bg-[var(--sg-primary)] text-white text-center hover:bg-[var(--sg-primary-dark)] transition-all duration-200 active:scale-95"
                    >
                      View on Map
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
