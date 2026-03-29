'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { type DogReport } from '@/lib/data'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  dogs: DogReport[]
  selectedDog: DogReport | null
  onMarkerClick: (dog: DogReport) => void
}

const priorityColors = {
  urgent: '#DC2626',
  medium: '#D97706',
  low: '#16A34A',
}

function MapUpdater({ selectedDog }: { selectedDog: DogReport | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedDog) {
      map.flyTo([selectedDog.latitude, selectedDog.longitude], 15, {
        duration: 0.5,
      })
    }
  }, [selectedDog, map])

  return null
}

export default function MapComponent({ dogs, selectedDog, onMarkerClick }: MapComponentProps) {
  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={12}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater selectedDog={selectedDog} />

      {dogs.map((dog) => {
        const isSelected = selectedDog?.id === dog.id
        const color = dog.status === 'rescued' 
          ? '#16A34A' 
          : priorityColors[dog.priority]
        const radius = dog.priority === 'urgent' ? 10 : 8

        return (
          <CircleMarker
            key={dog.id}
            center={[dog.latitude, dog.longitude]}
            radius={isSelected ? radius + 4 : radius}
            pathOptions={{
              color: isSelected ? '#1C1917' : color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onMarkerClick(dog),
            }}
            className={dog.priority === 'urgent' && !isSelected ? 'marker-urgent' : ''}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-semibold text-sm mb-1">{dog.location_address}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{dog.condition}</div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
