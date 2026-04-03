'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const MapPreview = dynamic(() => import('@/components/MapPreview'), {
  ssr: false,
})
import { 
  ChevronLeft, 
  Camera, 
  X, 
  MapPin, 
  Check,
  Loader2,
  CheckCircle,
  AlertCircle,
  Map,
  TriangleAlert
} from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'
import { PriorityBadge } from '@/components/street-guard/priority-badge'
import { submitReport } from '@/lib/api'
import { ReportResult } from '@/lib/data'
import { saveLocalReport } from '@/lib/local-reports'

const processingMessages = [
  'Analyzing the image with AI...',
  'Assessing injury severity...',
  'Finding nearest rescue NGO...',
  'Sending rescue alert...',
]

export default function ReportPage() {
  const [step, setStep] = useState(1)
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [locationDetected, setLocationDetected] = useState(false)
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const normalizedPhoneNumber = phoneNumber.trim()

  const handlePhoneNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
    setPhoneNumber(digitsOnly)

    if (phoneError) {
      setPhoneError(null)
    }
  }

  const validatePhoneNumber = () => {
    if (!normalizedPhoneNumber) {
      return 'Phone number is required.'
    }

    if (!/^\d+$/.test(normalizedPhoneNumber)) {
      return 'Phone number must contain only digits.'
    }

    if (normalizedPhoneNumber.length !== 10) {
      return 'Enter a valid 10-digit phone number.'
    }

    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImage(null)
    setImageFile(null)
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
    const phoneValidationError = validatePhoneNumber()

    if (phoneValidationError) {
      setPhoneError(phoneValidationError)
      setError(null)
      return
    }

    if (!imageFile || !location) {
      setError('Please upload an image and detect your location before submitting.')
      return
    }

    setError(null)
    setPhoneError(null)
    setStep(3)

    const messageInterval = setInterval(() => {
      setProcessingMessageIndex((prev) => (prev + 1) % processingMessages.length)
    }, 2000)

    try {
      const response = await submitReport({
        image: imageFile,
        latitude: location.lat,
        longitude: location.lng,
        address:
          address.trim() ||
          `Lat ${location.lat.toFixed(5)}, Lng ${location.lng.toFixed(5)}`,
        description: description.trim() || 'No description provided',
      })

      const locationAddress =
        address.trim() ||
        `Lat ${location.lat.toFixed(5)}, Lng ${location.lng.toFixed(5)}`

      saveLocalReport({
        imageUrl: image ?? '/placeholder.svg',
        latitude: location.lat,
        longitude: location.lng,
        locationAddress,
        description: description.trim() || 'No description provided',
        phoneNumber: normalizedPhoneNumber,
        urgency: response.assessment.priority,
        isInjured: response.assessment.is_injured,
        ngoName: response.rescue_dispatched ? response.ngo_name : null,
        rescueNeeded: response.assessment.rescue_needed,
      })

      setResult(response)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the report right now.')
      setStep(2)
    } finally {
      clearInterval(messageInterval)
    }
  }

  const resetForm = () => {
    setStep(1)
    setImage(null)
    setImageFile(null)
    setDescription('')
    setPhoneNumber('')
    setLocation(null)
    setAddress('')
    setLocationDetected(false)
    setResult(null)
    setProcessingMessageIndex(0)
    setError(null)
    setPhoneError(null)
  }

  useEffect(() => {
    if (step !== 3) {
      setProcessingMessageIndex(0)
    }
  }, [step])

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

                  <label className="block text-sm font-medium text-[var(--sg-neutral-700)] mt-4 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="Enter your 10-digit number"
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-[var(--sg-neutral-800)] placeholder:text-[var(--sg-neutral-400)] transition-all duration-200 ${
                      phoneError
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-[var(--sg-neutral-200)] focus:border-[var(--sg-primary)] focus:ring-2 focus:ring-[var(--sg-primary)]/20'
                    }`}
                  />
                  <p className={`mt-2 text-sm ${phoneError ? 'text-red-600' : 'text-[var(--sg-neutral-500)]'}`}>
                    {phoneError || 'Digits only. A 10-digit phone number is preferred.'}
                  </p>
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
                <div className="h-64 rounded-2xl overflow-hidden">
  {location ? (
    <MapPreview lat={location.lat} lng={location.lng} />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--sg-neutral-400)] bg-[var(--sg-neutral-100)]">
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
                  disabled={!locationDetected || !location}
                  className={`
                    px-8 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95
                    ${locationDetected && location
                      ? 'bg-[var(--sg-primary)] text-white hover:bg-[var(--sg-primary-dark)]'
                      : 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-400)] cursor-not-allowed'
                    }
                  `}
                >
                  Submit Report
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
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
                      {result.assessment.injury_description ||
                        result.assessment.body_condition_label ||
                        result.assessment.visible_conditions.join(', ') ||
                        description ||
                        'Assessment completed.'}
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
                      {result.assessment.rescue_needed && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Rescue needed
                        </span>
                      )}
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

                  {(result.status_updates?.length || result.possible_ngos?.length) && (
                    <div className="mt-6 space-y-4">
                      {result.status_updates && result.status_updates.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                          <h3 className="font-semibold text-[var(--sg-neutral-800)] mb-3">
                            Status updates
                          </h3>
                          <div className="space-y-2 text-sm text-[var(--sg-neutral-600)]">
                            {result.status_updates.map((update) => (
                              <p key={update}>{update}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.possible_ngos && result.possible_ngos.length > 0 && !result.rescue_dispatched && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                          <h3 className="font-semibold text-[var(--sg-neutral-800)] mb-3">
                            Nearby NGO suggestions
                          </h3>
                          <div className="space-y-3 text-sm text-[var(--sg-neutral-600)]">
                            {result.possible_ngos.map((ngo) => (
                              <div key={`${ngo.name}-${ngo.email || ngo.phone || 'ngo'}`}>
                                <p className="font-medium text-[var(--sg-neutral-800)]">{ngo.name}</p>
                                <p>
                                  {[
                                    ngo.specialization,
                                    ngo.coverage_area,
                                    typeof ngo.distance_km === 'number' ? `${ngo.distance_km} km away` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
