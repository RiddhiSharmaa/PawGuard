'use client'

import Image from 'next/image'
import { MapPin, Clock, Ambulance, Syringe } from 'lucide-react'
import { PriorityBadge } from './priority-badge'
import { type DogReport, getTimeAgo } from '@/lib/data'

interface DogCardProps {
  dog: DogReport
  onClick?: () => void
}

export function DogCard({ dog, onClick }: DogCardProps) {
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

        {/* Status */}
        {dog.status === 'rescue_dispatched' && dog.ngo_name && (
          <div className="flex items-center gap-1.5 text-green-600 text-[13px] mb-2">
            <Ambulance className="w-4 h-4 flex-shrink-0" />
            <span>Rescue dispatched · {dog.ngo_name}</span>
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
