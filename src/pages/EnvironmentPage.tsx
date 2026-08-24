import { useState } from 'react'
import {
  CloudRain,
  Crosshair,
  Layers,
  Loader2,
  RotateCw,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import Skeleton from '../components/common/Skeleton'
import { useEnvironmentalData } from '../hooks/useEnvironmentalData'
import type { AsyncState, EnvironmentalKey } from '../hooks/useEnvironmentalData'
import { getCurrentPosition, type GeolocationFailure } from '../services/geolocationService'
import { isValidLatitude, isValidLongitude, parseCoordinate } from '../utils/geo'

const cardClass = 'rounded-xl border border-slate-200 bg-white p-5'

function LiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
      Live data
    </span>
  )
}

function UnavailableBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      Unavailable
    </span>
  )
}

type AnyServiceState =
  | AsyncState<import('../types/environmental').RainfallData>
  | AsyncState<import('../types/environmental').SoilData>
  | AsyncState<import('../types/environmental').AirQualityData>

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  source: string
  state: AnyServiceState
  onRetry: () => void
  renderContent: () => React.ReactNode
}

function ServiceCard({ icon: Icon, title, source, state, onRetry, renderContent }: ServiceCardProps) {
  const badge =
    state.status === 'success' ? (
      <LiveBadge />
    ) : state.status === 'error' ? (
      <UnavailableBadge />
    ) : null

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Icon className="size-4" aria-hidden="true" />
          {title}
        </span>
        {badge}
      </div>

      {state.status === 'loading' || state.status === 'idle' ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : state.status === 'error' ? (
        <>
          <p role="alert" className="mt-3 text-xs leading-relaxed text-red-600">
            {state.error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCw className="size-3" aria-hidden="true" />
            Retry
          </button>
        </>
      ) : (
        <>
          {renderContent()}
          <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">{source}</p>
        </>
      )}
    </div>
  )
}

export default function EnvironmentPage() {
  const [latitudeInput, setLatitudeInput] = useState('')
  const [longitudeInput, setLongitudeInput] = useState('')
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ lat: number; lng: number } | null>(null)

  const parsedLat = parseCoordinate(latitudeInput, isValidLatitude)
  const parsedLng = parseCoordinate(longitudeInput, isValidLongitude)
  const hasCoordinates = submitted !== null

  const { states, reload } = useEnvironmentalData(submitted?.lat ?? null, submitted?.lng ?? null)

  function handleLoad() {
    if (parsedLat !== null && parsedLng !== null) {
      setSubmitted({ lat: parsedLat, lng: parsedLng })
    }
  }

  async function handleUseMyLocation() {
    if (gpsBusy) return
    setGpsBusy(true)
    setGpsError(null)
    try {
      const position = await getCurrentPosition()
      setLatitudeInput(position.latitude.toFixed(4))
      setLongitudeInput(position.longitude.toFixed(4))
      setSubmitted({ lat: position.latitude, lng: position.longitude })
    } catch (failure) {
      const kind = (failure as GeolocationFailure).kind
      setGpsError(
        kind === 'permission-denied'
          ? 'Location permission was denied — enter coordinates manually.'
          : kind === 'unsupported'
            ? 'Geolocation is not supported in this browser.'
            : 'Location detection failed — enter coordinates manually.',
      )
    } finally {
      setGpsBusy(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
    }`

  const retry = (key: EnvironmentalKey) => () => reload(key)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Environmental Data
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Live rainfall normals (Open-Meteo), soil properties (SoilGrids) and air
          quality (Open-Meteo) for any coordinates.
        </p>
      </div>

      <section className={cardClass}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="env-lat" className="mb-1.5 block text-sm font-medium text-slate-700">
              Latitude
            </label>
            <input
              id="env-lat"
              type="number"
              inputMode="decimal"
              value={latitudeInput}
              onChange={(event) => setLatitudeInput(event.target.value)}
              placeholder="21.1458"
              aria-invalid={latitudeInput.trim() !== '' && parsedLat === null}
              className={inputClass(latitudeInput.trim() !== '' && parsedLat === null)}
            />
          </div>
          <div>
            <label htmlFor="env-lng" className="mb-1.5 block text-sm font-medium text-slate-700">
              Longitude
            </label>
            <input
              id="env-lng"
              type="number"
              inputMode="decimal"
              value={longitudeInput}
              onChange={(event) => setLongitudeInput(event.target.value)}
              placeholder="79.0882"
              aria-invalid={longitudeInput.trim() !== '' && parsedLng === null}
              className={inputClass(longitudeInput.trim() !== '' && parsedLng === null)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={gpsBusy}
              aria-busy={gpsBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-70"
              title="Use my current location"
            >
              {gpsBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Crosshair className="size-4" aria-hidden="true" />
              )}
              GPS
            </button>
            <button
              type="button"
              onClick={handleLoad}
              disabled={parsedLat === null || parsedLng === null}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Load Data
            </button>
          </div>
        </div>
        {gpsError ? (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {gpsError}
          </p>
        ) : null}
      </section>

      {!hasCoordinates ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
          Enter coordinates above to fetch live environmental data.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ServiceCard
            icon={CloudRain}
            title="Rainfall"
            source={
              states.rainfall.data !== null
                ? `Open-Meteo Historical Weather · ${states.rainfall.data.periodStartYear}–${states.rainfall.data.periodEndYear} · ${states.rainfall.data.yearsUsed}-year normal`
                : 'Open-Meteo Historical Weather'
            }
            state={states.rainfall}
            onRetry={retry('rainfall')}
            renderContent={() => {
              const data = states.rainfall.data
              if (data === null) return null
              const peak = data.monthlyNormalsMm.reduce((max, entry) =>
                entry.totalMm > max.totalMm ? entry : max,
              )
              return (
                <>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {data.annualTotalMm.toLocaleString('en-IN')}{' '}
                    <span className="text-base font-medium">mm/year</span>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>Wettest month: {peak.month} ({peak.totalMm} mm)</li>
                    <li>Aggregated daily precipitation, averaged per year</li>
                  </ul>
                </>
              )
            }}
          />

          <ServiceCard
            icon={Layers}
            title="Soil"
            source="SoilGrids 2.0 · ISRIC World Soil Information"
            state={states.soil}
            onRetry={retry('soil')}
            renderContent={() => {
              const soil = states.soil.data
              if (soil === null) return null
              return (
                <>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {soil.textureClass ?? 'Limited data'}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>Sand {soil.sandPct ?? '—'}% · Silt {soil.siltPct ?? '—'}% · Clay {soil.clayPct ?? '—'}%</li>
                    <li>pH (H₂O): {soil.phH2o ?? '—'} · Depth {soil.depthLabel}</li>
                  </ul>
                </>
              )
            }}
          />

          <ServiceCard
            icon={Wind}
            title="Air Quality"
            source="Open-Meteo Air Quality API · current conditions"
            state={states.airQuality}
            onRetry={retry('airQuality')}
            renderContent={() => {
              const air = states.airQuality.data
              if (air === null) return null
              return (
                <>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {air.usAqi !== null ? `${Math.round(air.usAqi)}` : 'AQI unavailable'}
                    {air.category ? (
                      <span className="ml-2 align-middle text-xs font-normal text-slate-500">
                        {air.category}
                      </span>
                    ) : null}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    <li>PM2.5: {air.pm25UgM3 ?? '—'} µg/m³ · PM10: {air.pm10UgM3 ?? '—'} µg/m³</li>
                    {air.observedAt ? <li>Observed: {air.observedAt}</li> : null}
                    <li>Context only — not used in harvesting calculations</li>
                  </ul>
                </>
              )
            }}
          />
        </div>
      )}
    </div>
  )
}
