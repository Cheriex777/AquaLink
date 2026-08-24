import { useEffect, useRef } from 'react'
import {
  AlertCircle,
  CloudRain,
  Layers,
  MapPin,
  RotateCw,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import Skeleton from '../../common/Skeleton'
import { TextField } from '../fields'
import type { useEnvironmentalData, EnvironmentalKey } from '../../../hooks/useEnvironmentalData'
import type { StepProps } from './stepProps'

type EnvironmentStates = ReturnType<typeof useEnvironmentalData>['states']

type AnyEnvironmentState =
  | EnvironmentStates['rainfall']
  | EnvironmentStates['soil']
  | EnvironmentStates['airQuality']

interface Step4EnvironmentProps extends StepProps {
  hasCoordinates: boolean
  environmentStates: EnvironmentStates
  onReloadEnvironment: (key: EnvironmentalKey) => void
  onEditLocation: () => void
}

function LiveBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
      Live data
    </span>
  )
}

function EnvResultCard({
  icon: Icon,
  title,
  state,
  onRetry,
  renderContent,
}: {
  icon: LucideIcon
  title: string
  state: AnyEnvironmentState
  onRetry: () => void
  renderContent: () => React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Icon className="size-4" aria-hidden="true" />
          {title}
        </span>
        {state.status === 'success' ? (
          <LiveBadge />
        ) : state.status === 'error' ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Unavailable
          </span>
        ) : null}
      </div>

      {state.status === 'loading' || state.status === 'idle' ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : state.status === 'error' ? (
        <div className="mt-3">
          <p role="alert" className="flex items-start gap-1.5 text-xs text-red-600">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
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
        </div>
      ) : (
        renderContent()
      )}
    </div>
  )
}

export default function Step4Environment({
  draft,
  errors,
  onChange,
  hasCoordinates,
  environmentStates: states,
  onReloadEnvironment: reload,
  onEditLocation,
}: Step4EnvironmentProps) {
  const prefilledRef = useRef(false)

  useEffect(() => {
    if (
      states.rainfall.status === 'success' &&
      !prefilledRef.current &&
      states.rainfall.data !== null
    ) {
      const rainfallData = states.rainfall.data as { annualTotalMm?: unknown }
      if (typeof rainfallData.annualTotalMm === 'number') {
        prefilledRef.current = true
        onChange({ annualRainfallMm: String(rainfallData.annualTotalMm) })
      }
    }
  }, [states.rainfall.status, states.rainfall.data, onChange])

  function handleRainfallChange(value: string) {
    prefilledRef.current = true
    onChange({ annualRainfallMm: value })
  }

  const monsoonShare = (() => {
    if (states.rainfall.status !== 'success' || states.rainfall.data === null) return null
    const rainfall = states.rainfall.data as {
      monthlyNormalsMm?: Array<{ month: string; totalMm: number }>
      annualTotalMm?: number
    }
    if (!rainfall.monthlyNormalsMm || !rainfall.annualTotalMm) return null
    const monsoon = ['Jun', 'Jul', 'Aug', 'Sep']
    const monsoonMm = rainfall.monthlyNormalsMm
      .filter((entry) => monsoon.includes(entry.month))
      .reduce((sum, entry) => sum + entry.totalMm, 0)
    return Math.round((monsoonMm / rainfall.annualTotalMm) * 100)
  })()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Environmental review</h3>
        <p className="mt-1 text-sm text-slate-500">
          Fetched live for the property&apos;s coordinates — rainfall and air
          quality from Open-Meteo, soil from SoilGrids (ISRIC). Each source can
          fail independently without blocking the assessment.
        </p>
      </div>

      {!hasCoordinates ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                No location selected yet
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Environmental data needs coordinates. Go back to Step 1 to use
                GPS or pick the location on the map.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditLocation}
            className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Edit location
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <EnvResultCard
              icon={CloudRain}
              title="Annual Rainfall"
              state={states.rainfall}
              onRetry={() => reload('rainfall')}
              renderContent={() => {
                const data = states.rainfall.data as {
                  annualTotalMm: number
                  yearsUsed: number
                  periodStartYear: number
                  periodEndYear: number
                }
                return (
                  <>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                      {data.annualTotalMm.toLocaleString('en-IN')} mm/year
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>
                        {data.periodStartYear}–{data.periodEndYear} ·{' '}
                        {data.yearsUsed}-year climatological normal
                      </li>
                      {monsoonShare !== null ? (
                        <li>~{monsoonShare}% falls Jun–Sep</li>
                      ) : null}
                    </ul>
                  </>
                )
              }}
            />

            <EnvResultCard
              icon={Layers}
              title="Soil"
              state={states.soil}
              onRetry={() => reload('soil')}
              renderContent={() => {
                const soil = states.soil.data as {
                  textureClass: string | null
                  sandPct: number | null
                  siltPct: number | null
                  clayPct: number | null
                  phH2o: number | null
                  depthLabel: string
                }
                const parts: string[] = []
                if (soil.textureClass) parts.push(soil.textureClass)
                if (soil.clayPct !== null) parts.push(`${soil.clayPct}% clay`)
                if (soil.phH2o !== null) parts.push(`pH ${soil.phH2o}`)
                return (
                  <>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                      {parts.length > 0 ? parts.join(' · ') : 'Limited data'}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>
                        Sand {soil.sandPct ?? '—'}% · Silt {soil.siltPct ?? '—'}% ·
                        Clay {soil.clayPct ?? '—'}%
                      </li>
                      <li>SoilGrids top layer ({soil.depthLabel}) · ISRIC</li>
                    </ul>
                  </>
                )
              }}
            />

            <EnvResultCard
              icon={Wind}
              title="Air Quality"
              state={states.airQuality}
              onRetry={() => reload('airQuality')}
              renderContent={() => {
                const air = states.airQuality.data as {
                  usAqi: number | null
                  category: string | null
                  pm25UgM3: number | null
                  pm10UgM3: number | null
                }
                return (
                  <>
                    <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                      {air.usAqi !== null
                        ? `AQI ${Math.round(air.usAqi)}${air.category ? ` · ${air.category}` : ''}`
                        : 'AQI unavailable'}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      <li>
                        PM2.5: {air.pm25UgM3 ?? '—'} µg/m³ · PM10:{' '}
                        {air.pm10UgM3 ?? '—'} µg/m³
                      </li>
                      <li>Context only — not a calculation input</li>
                    </ul>
                  </>
                )
              }}
            />
          </div>

          <TextField
            id="annualRainfall"
            label="Annual rainfall used in this assessment"
            required
            value={draft.annualRainfallMm}
            onChange={handleRainfallChange}
            error={errors.annualRainfallMm}
            hint={
              states.rainfall.status === 'success'
                ? `Prefilled from Open-Meteo normals — edit to override (mm/year)`
                : 'Enter annual rainfall manually in mm/year (live data unavailable above)'
            }
          />
        </>
      )}
    </div>
  )
}
