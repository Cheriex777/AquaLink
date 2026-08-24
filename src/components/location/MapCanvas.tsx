import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { roundTo } from '../../utils/geo'
import { PROPERTY_ICON } from './mapIcons'

function MapClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(roundTo(event.latlng.lat), roundTo(event.latlng.lng))
    },
  })
  return null
}

function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 15), { animate: true })
  }, [map, latitude, longitude])
  return null
}

interface MapCanvasProps {
  latitude: number | null
  longitude: number | null
  onPick: (latitude: number, longitude: number) => void
}

export default function MapCanvas({ latitude, longitude, onPick }: MapCanvasProps) {
  const hasMarker = latitude !== null && longitude !== null
  const center: [number, number] = hasMarker ? [latitude!, longitude!] : [21.1458, 79.0882]

  return (
    <div className="relative z-0 h-64 w-full overflow-hidden rounded-lg border border-slate-200 sm:h-72">
      <MapContainer
        center={center}
        zoom={hasMarker ? 16 : 10}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickPicker onPick={onPick} />
        {hasMarker ? (
          <>
            <Marker
              position={[latitude!, longitude!]}
              icon={PROPERTY_ICON}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target as L.Marker
                  const position = marker.getLatLng()
                  onPick(roundTo(position.lat), roundTo(position.lng))
                },
              }}
            />
            <Recenter latitude={latitude!} longitude={longitude!} />
          </>
        ) : null}
      </MapContainer>
    </div>
  )
}
