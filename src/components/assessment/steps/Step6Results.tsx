import {
  ArrowDownToLine,
  BadgeCheck,
  CloudUpload,
  Container,
  Filter,
  Home,
  Loader2,
  MoveHorizontal,
  RotateCcw,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import DemandCoverageChart from '../../dashboard/DemandCoverageChart'
import MonthlyWaterChart from '../results/MonthlyWaterChart'
import CostBreakdownBars from '../results/CostBreakdownBars'
import EnvironmentalSummary from '../results/EnvironmentalSummary'
import type { useEnvironmentalData } from '../../../hooks/useEnvironmentalData'
import { isSupabaseConfigured } from '../../../services/supabaseClient'
import type { CalculationResult } from '../../../services/calculationService'
import { HARVEST_FORMULA } from '../../../services/calculationService'
import type { RecommendationResult, StructureType } from '../../../services/recommendationService'
import type { AssessmentDraft } from '../../../types/assessment'
import { formatINR, formatNumber } from '../../../utils/format'

type EnvironmentStates = ReturnType<typeof useEnvironmentalData>['states']

const STRUCTURE_ICONS: Record<StructureType, LucideIcon> = {
  recharge_pit: ArrowDownToLine,
  recharge_trench: MoveHorizontal,
  recharge_well: Waves,
  storage_tank: Container,
  filter_chamber: Filter,
  rooftop_system: Home,
}

const CONFIDENCE_STYLES: Record<Recommendation['confidence'], string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

interface Recommendation {
  structure: StructureType
  label: string
  description: string
  reason: string
  supportingFactors: string[]
  suitabilityPct: number
  confidence: 'high' | 'medium' | 'low'
}

interface Step6ResultsProps {
  result: CalculationResult
  recommendation: RecommendationResult | null
  environmentStates: EnvironmentStates
  draft: AssessmentDraft
  saveStatus: 'idle' | 'saving' | 'error'
  saveError: string | null
  signedIn: boolean
  onSaveToAccount: () => void
  onRestart: () => void
  onBackToReview: () => void
}

function Kpi({
  label,
  value,
  unit,
  caption,
  tone = 'default',
}: {
  label: string
  value: string
  unit?: string
  caption?: string
  tone?: 'default' | 'primary' | 'positive'
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-primary-200 bg-primary-50 text-primary-900'
      : tone === 'positive'
        ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
        : 'border-slate-200 bg-white text-slate-900'
  const labelClass =
    tone === 'primary'
      ? 'text-primary-700'
      : tone === 'positive'
        ? 'text-emerald-700'
        : 'text-slate-500'
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className={`text-xs font-medium ${labelClass}`}>{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium">{unit}</span> : null}
      </p>
      {caption ? <p className="mt-0.5 text-[11px] opacity-70">{caption}</p> : null}
    </div>
  )
}

function DetailSection({
  title,
  children,
  footer,
}: {
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <h4 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
        {title}
      </h4>
      <dl className="divide-y divide-slate-50 px-5 py-1">{children}</dl>
      {footer ? (
        <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">{footer}</p>
      ) : null}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

export default function Step6Results({
  result,
  recommendation,
  environmentStates,
  draft,
  saveStatus,
  saveError,
  signedIn,
  onSaveToAccount,
  onRestart,
  onBackToReview,
}: Step6ResultsProps) {
  const payback =
    result.paybackYears !== null ? `${formatNumber(result.paybackYears, 1)} yrs` : '—'
  const monthlyHarvestKl =
    result.harvest.monthlyLitres?.map((litres) => litres / 1000) ?? null
  const monthlyDemandKl = Math.round((result.demand.annualKl / 12) * 10) / 10
  const primaryRec = recommendation?.primary ?? null
  const PrimaryIcon = primaryRec ? STRUCTURE_ICONS[primaryRec.structure] : null
  const surplusKl = Math.round((result.harvest.annualKl - result.demand.annualKl) * 10) / 10

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
          Indicative engineering estimate
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Rainfall:{' '}
          {draft.annualRainfallMm.trim()
            ? `${formatNumber(Number(draft.annualRainfallMm))} mm/yr`
            : 'not set'}
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Assessment results — {draft.propertyName.trim() || 'your property'}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Computed by the JalSetu engine from your inputs, live environmental
          data where available, and the assumptions shown below.
        </p>
      </div>

      <section aria-label="Key results" className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi
            tone="primary"
            label="Harvest Potential"
            value={formatNumber(result.harvest.annualKl, 1)}
            unit="kL/yr"
            caption={`${formatNumber(result.runoff.annualLitres)} L raw runoff × efficiency`}
          />
          <Kpi
            label="Recharge Potential"
            value={
              result.recharge.status === 'assessed'
                ? formatNumber(result.recharge.potentialKl ?? 0, 1)
                : '—'
            }
            unit={result.recharge.status === 'assessed' ? 'kL/yr' : undefined}
            caption={
              result.recharge.status === 'assessed'
                ? 'Surplus routed to ground'
                : 'Open space needed'
            }
          />
          <Kpi
            label="Demand Coverage"
            value={`${result.coveragePct}%`}
            caption={`of ${formatNumber(result.demand.annualKl, 1)} kL/yr demand`}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi label="Estimated Cost" value={formatINR(result.cost.totalInr)} caption="Full system, installed" />
          <Kpi
            tone="positive"
            label="Annual Savings"
            value={formatINR(result.savings.annualInr)}
            caption={`${formatNumber(result.savings.utilisedKl, 1)} kL × ₹${result.savings.tariffPerKlInr}/kL`}
          />
          <Kpi label="Payback Period" value={payback} caption="Simple payback on savings" />
        </div>
      </section>

      {primaryRec && PrimaryIcon ? (
        <section
          aria-label="Recommended structure"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
              <PrimaryIcon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
                Recommended structure
              </p>
              <p className="text-lg font-semibold tracking-tight text-primary-900">
                {primaryRec.label} · {primaryRec.suitabilityPct}% suitable
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_STYLES[primaryRec.confidence]}`}
          >
            <BadgeCheck className="mr-1 size-3.5" aria-hidden="true" />
            {primaryRec.confidence} confidence
          </span>
        </section>
      ) : null}

      <section aria-label="Charts" className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          <h4 className="mb-1 text-sm font-semibold text-slate-900">
            Monthly harvest vs demand
          </h4>
          <p className="mb-3 text-xs text-slate-500">
            Climatological rainfall pattern applied to your roof
          </p>
          <MonthlyWaterChart
            monthlyHarvestKl={monthlyHarvestKl}
            monthlyDemandKl={monthlyDemandKl}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h4 className="mb-1 text-sm font-semibold text-slate-900">Demand coverage</h4>
          <p className="mb-3 text-xs text-slate-500">Share of yearly demand met by harvest</p>
          <DemandCoverageChart coveragePct={result.coveragePct} />
        </div>
      </section>

      {recommendation ? (
        <section aria-label="Recommended structures" className="rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Why this structure — supporting detail
            </h4>
          </header>
          <div className="space-y-5 px-5 py-5">
            <RecommendationBlock rec={recommendation.primary} highlighted />
            {recommendation.secondary ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Also suitable
                </p>
                <RecommendationBlock rec={recommendation.secondary} />
              </div>
            ) : null}
            {recommendation.complementary ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Add for best results
                </p>
                <RecommendationBlock rec={recommendation.complementary} />
              </div>
            ) : null}
            {recommendation.notes.length > 0 ? (
              <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                {recommendation.notes.map((note) => (
                  <li key={note} className="flex items-start gap-1.5 text-xs text-slate-500">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailSection title="Runoff calculation" footer={HARVEST_FORMULA}>
          <Row label="Roof area" value={`${formatNumber(result.input.roofAreaSqm)} m²`} />
          <Row label="Annual rainfall" value={`${formatNumber(result.input.annualRainfallMm)} mm`} />
          <Row label="Runoff coefficient" value={String(result.input.runoffCoefficient)} />
          <Row
            label="Collection efficiency"
            value={`${Math.round(result.input.collectionEfficiency * 100)}%`}
          />
          <Row label="Raw rooftop runoff" value={`${formatNumber(result.runoff.annualLitres)} L`} />
          <Row
            label="Harvest after losses"
            value={
              <>
                {formatNumber(result.harvest.annualLitres)} L{' '}
                <span className="font-normal text-slate-500">
                  ({formatNumber(result.harvest.annualKl, 1)} kL)
                </span>
              </>
            }
          />
        </DetailSection>

        <DetailSection title="Water demand analysis">
          <Row label="Residents" value={draft.householdSize || '—'} />
          <Row label="Per-capita use" value={`${draft.perCapitaLpd} L/person/day`} />
          <Row label="Daily demand" value={`${formatNumber(result.demand.dailyLitres, 1)} L`} />
          <Row label="Annual demand" value={`${formatNumber(result.demand.annualLitres)} L`} />
          <Row
            label={surplusKl >= 0 ? 'Surplus after demand' : 'Deficit (other sources)'}
            value={`${surplusKl >= 0 ? formatNumber(surplusKl, 1) : formatNumber(-surplusKl, 1)} kL/yr`}
          />
        </DetailSection>

        <DetailSection
          title="Environmental information"
          footer="Live sources: Open-Meteo (rainfall, air quality), SoilGrids / ISRIC (soil). Each can be unavailable independently."
        >
          <EnvironmentalSummary states={environmentStates} />
        </DetailSection>

        <DetailSection
          title="Cost-benefit analysis"
          footer="Indicative Indian market unit rates; refine with vendor quotes before construction."
        >
          <CostBreakdownBars
            filterInr={result.cost.filterInr}
            plumbingInr={result.cost.plumbingInr}
            tankLitres={result.cost.tankLitres}
            tankInr={result.cost.tankInr}
            rechargeStructureInr={result.cost.rechargeStructureInr}
            totalInr={result.cost.totalInr}
          />
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <p>
              Savings = utilised harvest ({formatNumber(result.savings.utilisedKl, 1)} kL){' '}
              × ₹{result.savings.tariffPerKlInr}/kL = {formatINR(result.savings.annualInr)}/yr
            </p>
            <p>
              Payback = {formatINR(result.cost.totalInr)} ÷{' '}
              {formatINR(result.savings.annualInr)} = {payback}
            </p>
          </div>
        </DetailSection>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500" role={draft.id ? 'status' : undefined}>
            {draft.id
              ? `Saved to your account · id ${draft.id.slice(0, 8)}… — re-saving updates it.`
              : isSupabaseConfigured
                ? signedIn
                  ? 'Save this assessment to your account to find it under My Reports.'
                  : 'Sign in (top-right) to save this assessment to your account.'
                : 'Cloud saving not configured — add Supabase keys to .env to enable.'}
          </p>
          <button
            type="button"
            onClick={onSaveToAccount}
            disabled={
              !isSupabaseConfigured || !signedIn || saveStatus === 'saving' || Boolean(draft.id)
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary-600 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : draft.id ? (
              <BadgeCheck className="size-4" aria-hidden="true" />
            ) : (
              <CloudUpload className="size-4" aria-hidden="true" />
            )}
            {draft.id ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving…' : 'Save to my account'}
          </button>
        </div>
        {saveError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {saveError}
          </p>
        ) : null}
        {!isSupabaseConfigured ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            Setup: create a free Supabase project, run supabase/schema.sql in its SQL editor,
            then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBackToReview}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Review
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Start New Assessment
        </button>
      </div>
    </div>
  )
}

function RecommendationBlock({
  rec,
  highlighted = false,
}: {
  rec: Recommendation
  highlighted?: boolean
}) {
  const Icon = STRUCTURE_ICONS[rec.structure]
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted ? 'border-primary-200 bg-primary-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-9 items-center justify-center rounded-lg ${
              highlighted ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className={`text-sm font-semibold ${highlighted ? 'text-primary-900' : 'text-slate-900'}`}>
              {rec.label}
            </p>
            <span className="text-xs text-slate-500">{rec.suitabilityPct}% suitability</span>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_STYLES[rec.confidence]}`}
        >
          {rec.confidence} confidence
        </span>
      </div>

      <p className={`mt-2.5 text-sm leading-relaxed ${highlighted ? 'text-primary-900' : 'text-slate-600'}`}>
        {rec.reason}
      </p>
      <p className="mt-1.5 text-xs text-slate-500">{rec.description}</p>

      {rec.supportingFactors.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {rec.supportingFactors.map((factor) => (
            <li
              key={factor}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                highlighted ? 'bg-primary-100/70 text-primary-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {factor}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
