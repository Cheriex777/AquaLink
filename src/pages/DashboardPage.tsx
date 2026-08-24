import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  CloudRain,
  Droplets,
  FileText,
  Home,
  Layers,
  PiggyBank,
  Plus,
  RefreshCw,
  Sparkles,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import Skeleton from '../components/common/Skeleton'
import RainfallChart from '../components/dashboard/RainfallChart'
import DemandCoverageChart from '../components/dashboard/DemandCoverageChart'
import RecentAssessments from '../components/dashboard/RecentAssessments'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../services/supabaseClient'
import {
  getAssessmentBundle,
  listAssessments,
  type AssessmentBundle,
} from '../services/assessmentStore'
import type { AssessmentListItem } from '../types/database'
import type {
  AirQualityData,
  MonthlyRainfallPoint,
  RainfallData,
  SoilData,
} from '../types/environmental'
import { formatINR, formatNumber } from '../utils/format'

interface DashboardData {
  items: AssessmentListItem[]
  latestBundle: AssessmentBundle | null
}

const cardClass = 'rounded-xl border border-slate-200 bg-white'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {[0, 1].map((i) => (
          <Skeleton key={i} className={`h-72 ${i === 0 ? 'lg:col-span-3' : 'lg:col-span-2'}`} />
        ))}
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}

function EnvMiniCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: LucideIcon
  title: string
  value: string
  detail: string
}) {
  return (
    <div className={`${cardClass} p-4`}>
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    return listAssessments()
      .then(async (items) => {
        let latestBundle: AssessmentBundle | null = null
        if (items.length > 0) {
          latestBundle = await getAssessmentBundle(items[0].id)
        }
        setData({ items, latestBundle })
      })
      .catch((fetchError: unknown) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load dashboard data. Please try again.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || authLoading || !user) {
      const timer = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => void fetchData(), 0)
    return () => window.clearTimeout(timer)
  }, [user, authLoading, fetchData])

  function handleRetry() {
    setLoading(true)
    setError(null)
    void fetchData()
  }

  if (!isSupabaseConfigured) {
    return (
      <section className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}>
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <CloudRain className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-slate-900">Connect your workspace</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          The dashboard shows your saved assessments. Add the Supabase keys from{' '}
          <code className="rounded bg-slate-100 px-1">.env.example</code> to a{' '}
          <code className="rounded bg-slate-100 px-1">.env</code> file and run{' '}
          <code className="rounded bg-slate-100 px-1">supabase/schema.sql</code> to enable it.
        </p>
        <Link
          to="/new-assessment"
          className="mt-5 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Run an assessment anyway
        </Link>
      </section>
    )
  }

  if (authLoading || (loading && !data)) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <section className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}>
        <h2 className="text-base font-semibold text-slate-900">Sign in to see your dashboard</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          Assessments are private to each account — sign in or create a free account to view
          summaries, environmental snapshots and saved reports.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Sign in to continue
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}>
        <AlertTriangle className="mb-3 size-8 text-red-500" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">Something went wrong</h2>
        <p role="alert" className="mt-1 max-w-md text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    )
  }

  if (!data) return <DashboardSkeleton />

  const { items, latestBundle } = data
  const harvestValues = items
    .map((item) => item.harvestKl)
    .filter((value): value is number => value !== null)
  const totalHarvestKl =
    harvestValues.length > 0
      ? Math.round(harvestValues.reduce((sum, value) => sum + value, 0))
      : null
  const avgRoofAreaSqm =
    items.length > 0
      ? Math.round(items.reduce((sum, item) => sum + item.roofAreaSqm, 0) / items.length)
      : 0

  const result = latestBundle?.result ?? null
  const rainfall = latestBundle?.environmental.find(
    (entry) => entry.source === 'rainfall',
  )?.payload as RainfallData | undefined
  const soil = latestBundle?.environmental.find(
    (entry) => entry.source === 'soil',
  )?.payload as SoilData | undefined
  const airQuality = latestBundle?.environmental.find(
    (entry) => entry.source === 'air_quality',
  )?.payload as AirQualityData | undefined

  const rainfallSeries: MonthlyRainfallPoint[] | null = rainfall
    ? rainfall.monthlyNormalsMm.map((entry) => ({
        month: entry.month,
        rainfallMm: entry.totalMm,
      }))
    : null

  const latestAssessment = latestBundle?.assessment ?? null
  const monsoonSharePct = (() => {
    if (!rainfall) return null
    const monsoonMonths = ['Jun', 'Jul', 'Aug', 'Sep']
    const monsoonMm = rainfall.monthlyNormalsMm
      .filter((entry) => monsoonMonths.includes(entry.month))
      .reduce((sum, entry) => sum + entry.totalMm, 0)
    return Math.round((monsoonMm / rainfall.annualTotalMm) * 100)
  })()

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-32 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-primary-100">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Water planning, made practical
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
              See your rainwater harvesting potential, environmental context, and latest property insights in one place.
            </p>
          </div>
          <Link
            to="/new-assessment"
            className="relative inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-950/30 hover:bg-primary-400"
          >
            <Plus className="size-4" aria-hidden="true" />
            Start New Assessment
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Your overview</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Assessment snapshot</h2>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          Browse all reports
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <section aria-label="Summary statistics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Saved Assessments"
            value={formatNumber(items.length)}
            sub="Private to your account"
          />
          <StatCard
            icon={Droplets}
            label="Harvest Potential"
            value={totalHarvestKl !== null ? `${formatNumber(totalHarvestKl)} kL/yr` : '—'}
            sub="Across all properties"
          />
          <StatCard
            icon={PiggyBank}
            label="Savings Potential"
            value={
              totalHarvestKl !== null ? formatINR(Math.round(totalHarvestKl * 40)) : '—'
            }
            sub="At ₹40/kL water tariff"
          />
          <StatCard
            icon={Home}
            label="Average Roof Area"
            value={items.length > 0 ? `${formatNumber(avgRoofAreaSqm)} m²` : '—'}
            sub="Per assessed property"
          />
        </div>
      </section>

      {latestAssessment && latestBundle ? (
        <section aria-label="Latest assessment">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Latest assessment — {latestAssessment.property_name}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {[latestAssessment.city, latestAssessment.state]
                  .filter(Boolean)
                  .join(', ') || 'Location not set'}
                {' · '}
                stored snapshots shown below
              </p>
            </div>
            <Link
              to={`/reports/${latestAssessment.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View full report
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className={`${cardClass} p-5 lg:col-span-3`}>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Monthly rainfall pattern
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                {rainfall
                  ? `${rainfall.periodStartYear}–${rainfall.periodEndYear} · ${rainfall.yearsUsed}-year normal · Open-Meteo`
                  : 'Stored snapshot unavailable'}
              </p>
              {rainfallSeries ? (
                <RainfallChart data={rainfallSeries} />
              ) : (
                <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  No rainfall snapshot was captured for this assessment.
                </div>
              )}
            </div>
            <div className={`${cardClass} p-5 lg:col-span-2`}>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Demand coverage</h3>
              <p className="mb-3 text-xs text-slate-500">From the engine result snapshot</p>
              {result ? (
                <DemandCoverageChart coveragePct={result.coveragePct} />
              ) : (
                <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                  Result snapshot unavailable.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EnvMiniCard
              icon={CloudRain}
              title="Annual rainfall"
              value={rainfall ? `${formatNumber(rainfall.annualTotalMm)} mm/yr` : 'Not captured'}
              detail={
                monsoonSharePct !== null ? `~${monsoonSharePct}% falls Jun–Sep` : 'Open-Meteo normal'
              }
            />
            <EnvMiniCard
              icon={Layers}
              title="Soil"
              value={soil ? `${soil.textureClass ?? 'Texture n/a'}` : 'Not captured'}
              detail={soil ? `Clay ${soil.clayPct ?? '—'}% · pH ${soil.phH2o ?? '—'} · SoilGrids` : 'SoilGrids snapshot'}
            />
            <EnvMiniCard
              icon={Wind}
              title="Air quality"
              value={
                airQuality && airQuality.usAqi !== null
                  ? `AQI ${Math.round(airQuality.usAqi)}`
                  : 'No reading'
              }
              detail="Context only — not a calculation input"
            />
          </div>
        </section>
      ) : null}

      <section aria-label="Recent assessments">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent assessments</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Click any row to open its full engineering report.
            </p>
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className={`${cardClass} overflow-hidden`}>
          <RecentAssessments items={items.slice(0, 5)} />
        </div>
      </section>
    </div>
  )
}
