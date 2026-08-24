import { useEffect, useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint } from '../../types/assessment'
import { PROPERTY_ICON, VERTEX_ICON } from './mapIcons'

export type MapLayerKind = 'streets' | 'satellite'

const LAYERS: Record<MapLayerKind, { url: string; attribution: string }> = {
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
}

function ClickHandler({
  drawing,
  onAddVertex,
  onTileError,
}: {
  drawing: boolean
  onAddVertex: (lat: number, lng: number) => void
  onTileError: () => void
}) {
  useMapEvents({
    click(event) {
      if (drawing) onAddVertex(event.latlng.lat, event.latlng.lng)
    },
    tileerror() {
      onTileError()
    },
  })
  return null
}

function FitOnMount({ points, center }: { points: GeoPoint[]; center: [number, number] }) {
  const map = useMap()
  const initialRef = useRef({ points, center })
  useEffect(() => {
    const initial = initialRef.current
    if (initial.points.length === 0) {
      map.setView(initial.center, 19)
      return
    }
    if (initial.points.length === 1) {
      map.setView([initial.points[0].lat, initial.points[0].lng], 19)
      return
    }
    const bounds = L.latLngBounds(
      initial.points.map((point) => [point.lat, point.lng]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 })
  }, [map])
  return null
}

interface RooftopDrawMapProps {
  center: [number, number]
  layer: MapLayerKind
  points: GeoPoint[]
  drawing: boolean
  propertyMarker?: GeoPoint | null
  onAddVertex: (latitude: number, longitude: number) => void
  onMoveVertex: (index: number, latitude: number, longitude: number) => void
  onTileError: () => void
}

export default function RooftopDrawMap({
  center,
  layer,
  points,
  drawing,
  propertyMarker,
  onAddVertex,
  onMoveVertex,
  onTileError,
}: RooftopDrawMapProps) {
  const positions = points.map((point) => [point.lat, point.lng] as [number, number])
  const closedShape = positions.length >= 3

  return (
    <div className={`relative z-0 h-full w-full ${drawing ? 'jalseyu-drawing' : ''}`}>
      <MapContainer
        center={center}
        zoom={19}
        minZoom={3}
        maxZoom={19}
        scrollWheelZoom
        doubleClickZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          key={layer}
          url={LAYERS[layer].url}
          attribution={LAYERS[layer].attribution}
        />
        <ClickHandler drawing={drawing} onAddVertex={onAddVertex} onTileError={onTileError} />
        <FitOnMount points={points} center={center} />

        {closedShape ? (
          <Polygon
            positions={positions}
            pathOptions={{
              color: '#0891b2',
              weight: 2,
              fillColor: '#22d3ee',
              fillOpacity: drawing ? 0.15 : 0.25,
            }}
          />
        ) : (
          <Polyline
            positions={positions}
            pathOptions={{ color: '#0891b2', weight: 2, dashArray: '4 4' }}
          />
        )}

        {propertyMarker !== undefined && propertyMarker !== null && points.length === 0 ? (
          <Marker position={[propertyMarker.lat, propertyMarker.lng]} icon={PROPERTY_ICON} />
        ) : null}

        {points.map((point, index) => (
          <Marker
            key={`${index}-${point.lat}-${point.lng}`}
            position={[point.lat, point.lng]}
            icon={VERTEX_ICON}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker
                const position = marker.getLatLng()
                onMoveVertex(index, position.lat, position.lng)
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
