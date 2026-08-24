import { CloudRain, Layers, Wind, type LucideIcon } from 'lucide-react'
import { deriveSoilPermeability } from '../../../services/recommendationService'

type EnvironmentStates = {
  rainfall: {
    status: 'idle' | 'loading' | 'success' | 'error'
    data: {
      annualTotalMm: number
      yearsUsed: number
      periodStartYear: number
      periodEndYear: number
      monthlyNormalsMm: Array<{ month: string; totalMm: number }>
    } | null
    error: string | null
  }
  soil: {
    status: 'idle' | 'loading' | 'success' | 'error'
    data: {
      textureClass: string | null
      sandPct: number | null
      siltPct: number | null
      clayPct: number | null
      phH2o: number | null
      depthLabel: string
      provider?: 'soilgrids-rest'
    | 'soilgrids-wms'
    | 'regional-fallback'
    | 'user-provided'
    } | null
    error: string | null
  }
  airQuality: {
    status: 'idle' | 'loading' | 'success' | 'error'
    data: {
      usAqi: number | null
      category: string | null
      pm25UgM3: number | null
      pm10UgM3: number | null
      observedAt: string | null
    } | null
    error: string | null
  }
}

interface EnvironmentalSummaryProps {
  states: EnvironmentStates
}

function StatusLine({
  icon: Icon,
  label,
  state,
  renderValue,
}: {
  icon: LucideIcon
  label: string
  state: { status: string; error: string | null; data: unknown }
  renderValue: () => React.ReactNode
}) {
  const value =
    state.status === 'success' ? (
      renderValue()
    ) : state.status === 'error' ? (
      <span className="text-slate-400">Unavailable — {state.error}</span>
    ) : (
      <span className="text-slate-400">Not loaded</span>
    )
  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <span className="font-medium text-slate-700">{label}: </span>
        <span className="text-slate-600">{value}</span>
      </div>
    </li>
  )
}

export default function EnvironmentalSummary({ states }: EnvironmentalSummaryProps) {
  const rainfall = states.rainfall.data
  const soil = states.soil.data
  const air = states.airQuality.data

  return (
    <ul className="divide-y divide-slate-50">
      <StatusLine
        icon={CloudRain}
        label="Rainfall"
        state={states.rainfall}
        renderValue={() =>
          rainfall ? (
            <>
              {rainfall.annualTotalMm.toLocaleString('en-IN')} mm/yr ·{' '}
              {rainfall.periodStartYear}–{rainfall.periodEndYear}{' '}
              {rainfall.yearsUsed}-year normal (Open-Meteo)
            </>
          ) : null
        }
      />
      <StatusLine
        icon={Layers}
        label="Soil"
        state={states.soil}
        renderValue={() =>
          soil ? (
            <>
              {soil.textureClass ?? 'Texture n/a'}
              {soil.clayPct !== null ? ` · ${soil.clayPct}% clay` : ''}
              {soil.phH2o !== null ? ` · pH ${soil.phH2o}` : ''} ·{' '}
               {deriveSoilPermeability(soil.textureClass)} permeability (
               {soil.provider === 'user-provided' ? 'user-provided' : 'SoilGrids'})
            </>
          ) : null
        }
      />
      <StatusLine
        icon={Wind}
        label="Air quality"
        state={states.airQuality}
        renderValue={() =>
          air && air.usAqi !== null ? (
            <>
              AQI {Math.round(air.usAqi)}
              {air.category ? ` (${air.category})` : ''} · PM2.5{' '}
              {air.pm25UgM3 ?? '—'} µg/m³ — context only, not a calculation input
            </>
          ) : (
            'No reading available — context only, not a calculation input'
          )
        }
      />
    </ul>
  )
}
