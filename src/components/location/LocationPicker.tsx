import { useEffect, useRef, useState } from 'react'
import { Crosshair, Loader2, MapPin, OctagonX } from 'lucide-react'
import MapCanvas from './MapCanvas'
import { getCurrentPosition, type GeolocationFailure } from '../../services/geolocationService'
import { reverseGeocode } from '../../services/geocodingService'
import { isValidLatitude, isValidLongitude, parseCoordinate } from '../../utils/geo'

interface LocationPickerProps {
  latitude: string
  longitude: string
  latitudeError?: string
  longitudeError?: string
  onChange: (latitude: string, longitude: string) => void
}

type GpsStatus =
  | { state: 'idle' }
  | { state: 'locating' }
  | { state: 'error'; message: string }

type AddressStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready'; text: string }
  | { state: 'failed' }

const GPS_ERROR_MESSAGES: Record<GeolocationFailure['kind'], string> = {
  unsupported:
    'Geolocation is not supported by this browser. Please pick the location on the map or enter coordinates manually.',
  'permission-denied':
    'Location permission was denied. Allow location access for this site in your browser settings, or select the location manually below.',
  'position-unavailable':
    'Your device could not determine a position (GPS unavailable). Try again, or select the location manually.',
  timeout:
    'Getting your location timed out. Move to an open area and retry, or select manually.',
  'invalid-response':
    'The device returned invalid coordinates. Please select the location manually.',
  unknown:
    'Location detection failed. Please try again or select the location manually.',
}

export default function LocationPicker({
  latitude,
  longitude,
  latitudeError,
  longitudeError,
  onChange,
}: LocationPickerProps) {
  const [gps, setGps] = useState<GpsStatus>({ state: 'idle' })
  const [address, setAddress] = useState<AddressStatus>({ state: 'idle' })
  const gpsRequestRef = useRef<AbortController | null>(null)

  const parsedLatitude = parseCoordinate(latitude, isValidLatitude)
  const parsedLongitude = parseCoordinate(longitude, isValidLongitude)
  const hasMarker = parsedLatitude !== null && parsedLongitude !== null

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      if (parsedLatitude === null || parsedLongitude === null) {
        setAddress({ state: 'idle' })
        return
      }
      setAddress({ state: 'loading' })
      reverseGeocode(parsedLatitude, parsedLongitude, controller.signal)
        .then((result) => setAddress({ state: 'ready', text: result.displayName }))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setAddress({ state: 'failed' })
        })
    }, 700)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [parsedLatitude, parsedLongitude])

  useEffect(
    () => () => {
      gpsRequestRef.current?.abort()
    },
    [],
  )

  async function handleUseMyLocation() {
    if (gps.state === 'locating') return
    setGps({ state: 'locating' })
    const controller = new AbortController()
    gpsRequestRef.current = controller
    try {
      const position = await getCurrentPosition()
      if (controller.signal.aborted) return
      onChange(String(position.latitude), String(position.longitude))
      setGps({
        state: 'idle',
      })
    } catch (failure) {
      if (controller.signal.aborted) return
      const kind = (failure as GeolocationFailure).kind
      setGps({ state: 'error', message: GPS_ERROR_MESSAGES[kind] ?? GPS_ERROR_MESSAGES.unknown })
    }
  }

  function handlePick(lat: number, lng: number) {
    setGps({ state: 'idle' })
    onChange(String(lat), String(lng))
  }

  function handleClear() {
    setGps({ state: 'idle' })
    onChange('', '')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gps.state === 'locating'}
          aria-busy={gps.state === 'locating'}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-wait disabled:opacity-70"
        >
          {gps.state === 'locating' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Crosshair className="size-4" aria-hidden="true" />
          )}
          {gps.state === 'locating' ? 'Detecting location…' : 'Use my current location'}
        </button>
        {hasMarker ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <OctagonX className="size-3.5" aria-hidden="true" />
            Clear location
          </button>
        ) : null}
      </div>

      {gps.state === 'error' ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {gps.message}
        </div>
      ) : null}

      <MapCanvas
        latitude={parsedLatitude}
        longitude={parsedLongitude}
        onPick={handlePick}
      />
      <p className="-mt-2 text-[11px] text-slate-400">
        Tap the map or drag the pin to position the property · scroll-zoom is off
        so page scrolling stays smooth.
      </p>

      <p className="flex min-h-5 items-start gap-1.5 text-xs text-slate-500" aria-live="polite">
        {address.state === 'loading' ? (
          <>
            <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-slate-400" aria-hidden="true" />
            Looking up address…
          </>
        ) : address.state === 'ready' ? (
          <>
            <MapPin className="mt-0.5 size-3 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="line-clamp-2">{address.text}</span>
            <span className="shrink-0 text-slate-400">· © OpenStreetMap</span>
          </>
        ) : address.state === 'failed' ? (
          <span className="text-slate-400">
            Address lookup unavailable — coordinates still saved, you can continue.
          </span>
        ) : (
          <span className="text-slate-400">
            No location selected yet. Use GPS or tap the map.
          </span>
        )}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="latitude" className="mb-1.5 block text-sm font-medium text-slate-700">
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            inputMode="decimal"
            value={latitude}
            onChange={(event) => onChange(event.target.value, longitude)}
            placeholder="e.g. 21.1458"
            aria-invalid={Boolean(latitudeError)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
              latitudeError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
            }`}
          />
          {latitudeError ? (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {latitudeError}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">−90 to 90</p>
          )}
        </div>
        <div>
          <label htmlFor="longitude" className="mb-1.5 block text-sm font-medium text-slate-700">
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            inputMode="decimal"
            value={longitude}
            onChange={(event) => onChange(latitude, event.target.value)}
            placeholder="e.g. 79.0882"
            aria-invalid={Boolean(longitudeError)}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
              longitudeError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
            }`}
          />
          {longitudeError ? (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {longitudeError}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">−180 to 180</p>
          )}
        </div>
      </div>
    </div>
  )
}
