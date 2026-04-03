'use client'

import { useState } from 'react'
import { Building2, FileText, ShieldCheck, Upload, CircleAlert, CheckCircle2 } from 'lucide-react'
import { TopNav } from '@/components/street-guard/top-nav'

type FormState = {
  ngoName: string
  address: string
  phone: string
  email: string
  website: string
  areaOfOperation: string
  availability: string
  description: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialFormState: FormState = {
  ngoName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  areaOfOperation: '',
  availability: '',
  description: '',
}

export default function NGORegisterPage() {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const handleFieldChange = (field: keyof FormState, value: string) => {
    const nextValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value

    setForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }))

    setErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const nextErrors = { ...prev }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!form.ngoName.trim()) {
      nextErrors.ngoName = 'NGO name is required.'
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Location or address is required.'
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Contact phone number is required.'
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Enter a valid 10-digit phone number.'
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    return nextErrors
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitMessage(null)
      return
    }

    const payload = {
      ...form,
      registrationCertificate: certificateFile?.name ?? null,
      verificationDocument: verificationFile?.name ?? null,
    }

    console.log('Mock NGO registration submitted:', payload)
    setErrors({})
    setSubmitMessage('Registration details captured locally. This is a frontend-only mock submission.')
  }

  const inputClassName =
    'w-full rounded-xl border border-[var(--sg-neutral-200)] bg-white px-4 py-3 text-[var(--sg-neutral-800)] outline-none transition-all duration-200 placeholder:text-[var(--sg-neutral-400)] focus:border-[var(--sg-primary)] focus:ring-2 focus:ring-[var(--sg-primary)]/15'

  return (
    <>
      <TopNav />
      <main className="min-h-screen bg-[var(--sg-neutral-50)] pt-20 pb-12">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
          <section className="mb-8 overflow-hidden rounded-[28px] border border-[var(--sg-primary)]/15 bg-[linear-gradient(135deg,rgba(249,115,22,0.10),rgba(255,255,255,0.96))] p-8 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--sg-primary)]">
              <ShieldCheck className="h-4 w-4" />
              NGO Coordination Guidelines
            </div>
            <h1 className="mb-3 font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--sg-neutral-900)] md:text-4xl">
              Join the PawGuard response network
            </h1>
            <p className="max-w-3xl text-[15px] leading-7 text-[var(--sg-neutral-700)]">
              PawGuard helps coordinate rescue support for urgent stray-dog cases. NGOs are expected to respond quickly,
              prioritize critical reports when possible, and stay reasonably responsive so rescuers can act fast. This is
              a coordination platform built around cooperation and visibility, not strict enforcement.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-black/5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sg-primary-light)] text-[var(--sg-primary)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)]">
                    Registration Details
                  </h2>
                  <p className="text-sm text-[var(--sg-neutral-500)]">
                    Required fields are marked and validated locally.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    NGO Name *
                  </label>
                  <input
                    type="text"
                    value={form.ngoName}
                    onChange={(e) => handleFieldChange('ngoName', e.target.value)}
                    placeholder="e.g. Friendicoes SECA"
                    className={inputClassName}
                  />
                  {errors.ngoName && <p className="mt-2 text-sm text-red-600">{errors.ngoName}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="10-digit phone number"
                    className={inputClassName}
                  />
                  <p className={`mt-2 text-sm ${errors.phone ? 'text-red-600' : 'text-[var(--sg-neutral-500)]'}`}>
                    {errors.phone || 'Digits only. A 10-digit number is preferred.'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Location / Address *
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="Street, area, city"
                    className={inputClassName}
                  />
                  {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="ngo@example.org"
                    className={inputClassName}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Website / Social Links
                  </label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                    placeholder="Website or Instagram/Facebook link"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Area of Operation
                  </label>
                  <input
                    type="text"
                    value={form.areaOfOperation}
                    onChange={(e) => handleFieldChange('areaOfOperation', e.target.value)}
                    placeholder="e.g. South Delhi, NCR"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={form.availability}
                    onChange={(e) => handleFieldChange('availability', e.target.value)}
                    placeholder="e.g. 24/7, weekdays, daytime only"
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[var(--sg-neutral-700)]">
                    Description / About NGO
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Briefly describe rescue focus, capacity, and special support."
                    rows={5}
                    className={`${inputClassName} resize-none`}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-black/5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sg-primary-light)] text-[var(--sg-primary)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--sg-neutral-900)]">
                    Documents
                  </h2>
                  <p className="text-sm text-[var(--sg-neutral-500)]">
                    Files are selected in the browser only. No upload or backend storage is performed.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FilePicker
                  label="Registration Certificate"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={certificateFile}
                  onChange={setCertificateFile}
                />
                <FilePicker
                  label="Verification Documents"
                  accept=".pdf,.jpg,.jpeg,.png"
                  file={verificationFile}
                  onChange={setVerificationFile}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-dashed border-[var(--sg-neutral-200)] bg-white/70 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sg-primary)]">
                    
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--sg-neutral-600)]">
                    
                  </p>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--sg-primary)] px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-[var(--sg-primary-dark)] active:scale-95"
                >
                  Submit Registration
                </button>
              </div>

              {submitMessage && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              )}

              {Object.keys(errors).length > 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Please fix the highlighted required fields before submitting.</span>
                </div>
              )}
            </section>
          </form>
        </div>
      </main>
    </>
  )
}

function FilePicker({
  label,
  accept,
  file,
  onChange,
}: {
  label: string
  accept: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div className="rounded-2xl border border-[var(--sg-neutral-200)] bg-[var(--sg-neutral-50)] p-5">
      <label className="mb-3 block text-sm font-medium text-[var(--sg-neutral-700)]">{label}</label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--sg-primary)]/35 bg-white px-4 py-4 text-sm font-medium text-[var(--sg-primary)] transition-all duration-200 hover:border-[var(--sg-primary)] hover:bg-[var(--sg-primary-light)]/30">
        <Upload className="h-4 w-4" />
        Select file
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      <p className="mt-3 text-sm text-[var(--sg-neutral-500)]">
        Accepted: PDF, JPG, PNG
      </p>
      <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-[var(--sg-neutral-700)]">
        {file ? file.name : 'No file selected'}
      </p>
    </div>
  )
}
