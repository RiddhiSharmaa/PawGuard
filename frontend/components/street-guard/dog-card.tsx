'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { MapPin, Clock, Ambulance, Syringe, Eye, Phone } from 'lucide-react'
import { PriorityBadge } from './priority-badge'
import { type DogReport, getTimeAgo } from '@/lib/data'
import {
  dogCardStatusOptions,
  getDefaultDogCardStatus,
  getStoredDogCardStatus,
  saveDogCardStatus,
  type DogCardStatus,
} from '@/lib/dog-card-status'

interface DogCardProps {
  dog: DogReport
  onClick?: () => void
}

export function DogCard({ dog, onClick }: DogCardProps) {
  const defaultStatus = useMemo(() => getDefaultDogCardStatus(dog), [dog.id])
  const [status, setStatus] = useState<DogCardStatus>(defaultStatus)

  useEffect(() => {
    const storedStatus = getStoredDogCardStatus(dog.id)
    setStatus(storedStatus ?? defaultStatus)
  }, [dog.id, defaultStatus])

  const handleStatusChange = useCallback((nextStatus: DogCardStatus) => {
    setStatus(nextStatus)
    saveDogCardStatus(dog.id, nextStatus)
  }, [dog.id])

  const statusBadgeClassName = useMemo(() => ({
    Reported: 'bg-[var(--sg-neutral-200)] text-[var(--sg-neutral-700)]',
    'Being Monitored': 'bg-amber-100 text-amber-700',
    Rescued: 'bg-green-100 text-green-700',
    Vaccinated: 'bg-blue-100 text-blue-700',
    Treated: 'bg-violet-100 text-violet-700',
  }[status]), [status])

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-sm overflow-hidden
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[var(--sg-neutral-100)]">
        <Image
          src={dog.image_url}
          alt={`Dog at ${dog.location_address}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute top-3 right-3">
          <PriorityBadge priority={dog.priority} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-[var(--sg-neutral-600)] text-[13px] mb-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{dog.location_address}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-[var(--sg-neutral-400)] text-[13px] mb-3">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{getTimeAgo(dog.reported_at)}</span>
        </div>

        {/* Condition */}
        <p className="text-[var(--sg-neutral-800)] text-[15px] leading-snug line-clamp-2 mb-3">
          {dog.condition}
        </p>

        <div className="mb-3 rounded-xl border border-[var(--sg-neutral-200)] bg-[var(--sg-neutral-50)] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--sg-neutral-500)]">
              Status
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusBadgeClassName}`}>
              {status}
            </span>
          </div>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as DogCardStatus)}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-lg border border-[var(--sg-neutral-200)] bg-white px-3 py-2 text-[13px] text-[var(--sg-neutral-700)] outline-none transition-all duration-200 focus:border-[var(--sg-primary)] focus:ring-2 focus:ring-[var(--sg-primary)]/15"
            aria-label={`Update status for dog report ${dog.id}`}
          >
            {dogCardStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {dog.phone_number && (
          <div className="flex items-center gap-1.5 text-[var(--sg-neutral-600)] text-[13px] mb-3">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{dog.phone_number}</span>
          </div>
        )}

        {/* Status */}
        {dog.status === 'rescue_dispatched' && dog.ngo_name && (
          <div className="flex items-center gap-1.5 text-green-600 text-[13px] mb-2">
            <Ambulance className="w-4 h-4 flex-shrink-0" />
            <span>Rescue dispatched · {dog.ngo_name}</span>
          </div>
        )}

        {dog.status === 'processing' && (
          <div className="flex items-center gap-1.5 text-blue-600 text-[13px] mb-2">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>AI triage in progress</span>
          </div>
        )}

        {dog.status === 'monitoring' && (
          <div className="flex items-center gap-1.5 text-amber-700 text-[13px] mb-2">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>Being monitored</span>
          </div>
        )}

        {dog.status === 'rescued' && dog.ngo_name && (
          <div className="flex items-center gap-1.5 text-green-600 text-[13px] mb-2">
            <Ambulance className="w-4 h-4 flex-shrink-0" />
            <span>Rescued by {dog.ngo_name}</span>
          </div>
        )}

        {/* Vaccinated Badge */}
        {dog.is_vaccinated && (
          <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-[12px] font-medium">
            <Syringe className="w-3 h-3" />
            Vaccinated
          </div>
        )}
      </div>
    </div>
  )
}
