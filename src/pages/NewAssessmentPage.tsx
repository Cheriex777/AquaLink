import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import Stepper, { type WizardStep } from '../components/assessment/Stepper'
import Step1Property from '../components/assessment/steps/Step1Property'
import Step2Rooftop from '../components/assessment/steps/Step2Rooftop'
import Step3WaterDemand from '../components/assessment/steps/Step3WaterDemand'
import Step4Environment from '../components/assessment/steps/Step4Environment'
import Step5Review from '../components/assessment/steps/Step5Review'
import Step6Results from '../components/assessment/steps/Step6Results'
import type { StepProps } from '../components/assessment/steps/stepProps'
import {
  validatePropertyStep,
  validateReviewStep,
  validateRooftopStep,
  validateWaterDemandStep,
  type FieldErrors,
} from '../lib/validation'
import {
  calculateAssessmentFromDraft,
  type CalculationResult,
} from '../services/calculationService'
import {
  recommendRechargeStructures,
  type RecommendationResult,
} from '../services/recommendationService'
import { useEnvironmentalData } from '../hooks/useEnvironmentalData'
import { isValidLatitude, isValidLongitude, parseCoordinate } from '../utils/geo'
import { useAuth } from '../hooks/useAuth'
import {
  saveAssessment,
  type EnvironmentalSnapshots,
} from '../services/assessmentStore'
import {
  EMPTY_DRAFT,
  isDraftEmpty,
  isGeoPoint,
  type AssessmentDraft,
} from '../types/assessment'

const DRAFT_STORAGE_KEY = 'jalsetu.draft-assessment.v1'

const STEP_INDEX = { PROPERTY: 0, ROOFTOP: 1, DEMAND: 2, ENVIRONMENT: 3, REVIEW: 4, RESULTS: 5 }

const STEPS: WizardStep[] = [
  { id: 'property', shortLabel: 'Property', title: 'Property & Location' },
  { id: 'rooftop', shortLabel: 'Rooftop', title: 'Rooftop Details' },
  { id: 'demand', shortLabel: 'Demand', title: 'Water Demand' },
  { id: 'environment', shortLabel: 'Environment', title: 'Environmental Review' },
  { id: 'review', shortLabel: 'Review', title: 'Assessment Review' },
  { id: 'results', shortLabel: 'Results', title: 'Results' },
]

const VALIDATORS: Array<((draft: AssessmentDraft) => FieldErrors) | undefined> = [
  validatePropertyStep,
  validateRooftopStep,
  validateWaterDemandStep,
  undefined,
  validateReviewStep,
  undefined,
]

function loadDraftFromStorage(): { draft: AssessmentDraft; hasContent: boolean } {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return { draft: EMPTY_DRAFT, hasContent: false }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { draft: EMPTY_DRAFT, hasContent: false }
    }
    const merged: AssessmentDraft = { ...EMPTY_DRAFT, roofPolygon: [] }
    const source = parsed as Record<string, unknown>
    const target = merged as unknown as Record<string, string>
    for (const key of Object.keys(EMPTY_DRAFT) as (keyof AssessmentDraft)[]) {
      if (key === 'roofPolygon' || key === 'roofAreaSource' || key === 'id') continue
      const value = source[key]
      if (typeof value === 'string') target[key] = value
    }
    const rawId = source.id
    if (rawId === null || typeof rawId === 'string') {
      merged.id = rawId
    }
    const rawPolygon = source.roofPolygon
    if (Array.isArray(rawPolygon)) {
      merged.roofPolygon = rawPolygon.filter(isGeoPoint).slice(0, 500)
    }
    merged.roofAreaSource =
      source.roofAreaSource === 'satellite-measured' ? 'satellite-measured' : 'manual'
    return { draft: merged, hasContent: !isDraftEmpty(merged) }
  } catch {
    return { draft: EMPTY_DRAFT, hasContent: false }
  }
}

export default function NewAssessmentPage() {
  const [initialState] = useState(loadDraftFromStorage)
  const [draft, setDraft] = useState<AssessmentDraft>(initialState.draft)
  const [stepIndex, setStepIndex] = useState(0)
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [computing, setComputing] = useState(false)
  const [estimate, setEstimate] = useState<CalculationResult | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [estimateFailed, setEstimateFailed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const { user } = useAuth()
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [resetArmed, setResetArmed] = useState(false)

  const computeTimerRef = useRef<number | null>(null)
  const resetTimerRef = useRef<number | null>(null)

  const wizardLatitude = parseCoordinate(draft.latitude, isValidLatitude)
  const wizardLongitude = parseCoordinate(draft.longitude, isValidLongitude)
  const wizardHasCoordinates = wizardLatitude !== null && wizardLongitude !== null
  const { states: environmentStates, reload: reloadEnvironment } = useEnvironmentalData(
    wizardHasCoordinates ? wizardLatitude : null,
    wizardHasCoordinates ? wizardLongitude : null,
  )

  const effectiveSoil =
    draft.soilTextureOverride.trim() !== ''
      ? {
          ...(environmentStates.soil.data ?? {
            sandPct: null,
            siltPct: null,
            clayPct: null,
            phH2o: null,
            depthLabel: 'User-provided',
          }),
          textureClass: draft.soilTextureOverride.trim(),
          provider: 'user-provided' as const,
        }
      : environmentStates.soil.data

  useEffect(
    () => () => {
      if (computeTimerRef.current !== null) window.clearTimeout(computeTimerRef.current)
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        if (!cancelled) {
          setSavedAt(
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          )
        }
      } catch {
        if (!cancelled) setSavedAt(null)
      }
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [draft])

  const updateDraft = useCallback((patch: Partial<AssessmentDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  const goToStep = useCallback((index: number) => {
    setErrors({})
    setStepIndex(index)
    setMaxVisitedIndex((max) => Math.max(max, index))
  }, [])

  function handleNext() {
    if (computing) return
    const validate = VALIDATORS[stepIndex]
    if (validate) {
      const stepErrors = validate(draft)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        return
      }
    }
    setErrors({})
    if (stepIndex === STEP_INDEX.REVIEW) {
      runComputation()
      return
    }
    goToStep(Math.min(stepIndex + 1, STEP_INDEX.RESULTS))
  }

  function handleBack() {
    if (computing || stepIndex === 0) return
    setErrors({})
    setStepIndex((index) => index - 1)
  }

  function runComputation() {
    setComputing(true)
    computeTimerRef.current = window.setTimeout(() => {
      try {
        const result = calculateAssessmentFromDraft(draft, {
          monthlyRainfallMm:
            environmentStates.rainfall.data?.monthlyNormalsMm?.map(
              (entry) => entry.totalMm,
            ) ?? undefined,
        })
        setEstimate(result)
        setEstimateFailed(false)
        const openSpaceTrimmed = draft.openSpaceSqm.trim()
        setRecommendation(
          recommendRechargeStructures({
            roofAreaSqm: result.input.roofAreaSqm,
            annualRainfallMm: result.input.annualRainfallMm,
            annualHarvestKl: result.harvest.annualKl,
            annualDemandKl: result.demand.annualKl,
            openSpaceSqm:
              openSpaceTrimmed === '' ? null : Number(openSpaceTrimmed),
             soilTextureClass: effectiveSoil?.textureClass ?? null,
            monthlyRainfallMm: result.harvest.monthlyLitres
              ? environmentStates.rainfall.data?.monthlyNormalsMm?.map(
                  (entry) => entry.totalMm,
                ) ?? null
              : null,
          }),
        )
      } catch {
        setEstimate(null)
        setRecommendation(null)
        setEstimateFailed(true)
      }
      setComputing(false)
      goToStep(STEP_INDEX.RESULTS)
    }, 800)
  }

  function collectEnvironmentSnapshots(): EnvironmentalSnapshots {
    return {
      rainfall:
        environmentStates.rainfall.status === 'success'
          ? environmentStates.rainfall.data
          : null,
      soil: effectiveSoil,
      airQuality:
        environmentStates.airQuality.status === 'success'
          ? environmentStates.airQuality.data
          : null,
    }
  }

  async function handleSaveToAccount() {
    if (!estimate || saveStatus === 'saving' || !user) return
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const { id } = await saveAssessment(
        {
          draft,
          result: estimate,
          recommendation,
          environment: collectEnvironmentSnapshots(),
        },
        draft.id ?? undefined,
      )
      updateDraft({ id })
      setSaveStatus('idle')
    } catch (error) {
      setSaveStatus('error')
      setSaveError(
        error instanceof Error ? error.message : 'Saving failed — please retry.',
      )
    }
  }

  function restart() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // ignore storage failures
    }
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setEstimate(null)
    setRecommendation(null)
    setEstimateFailed(false)
    setStepIndex(0)
    setMaxVisitedIndex(0)
    setResetArmed(false)
  }

  function handleResetClick() {
    if (!resetArmed) {
      setResetArmed(true)
      resetTimerRef.current = window.setTimeout(() => setResetArmed(false), 3000)
      return
    }
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    restart()
  }

  const isResults = stepIndex === STEP_INDEX.RESULTS
  const isReview = stepIndex === STEP_INDEX.REVIEW

  const stepProps: StepProps = { draft, errors, onChange: updateDraft }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            New Assessment
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Six quick steps to a rainwater harvesting preview.
          </p>
        </div>
        {!isResults ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400" role="status">
              <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden="true" />
              {savedAt ? `Draft saved locally · ${savedAt}` : 'Saving draft…'}
            </span>
            <button
              type="button"
              onClick={handleResetClick}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                resetArmed
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {resetArmed ? 'Confirm reset?' : 'Reset'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Stepper
          steps={STEPS}
          currentIndex={stepIndex}
          maxVisitedIndex={maxVisitedIndex}
          disabled={computing}
          onSelect={goToStep}
        />

        {initialState.hasContent && stepIndex === 0 && !isResults ? (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 sm:px-8">
            <p className="text-xs text-amber-800">
              A saved draft was found on this device and restored.
            </p>
            <button
              type="button"
              onClick={restart}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-amber-900 underline underline-offset-2 hover:bg-amber-100"
            >
              Start fresh
            </button>
          </div>
        ) : null}

        <div className="px-5 py-6 sm:px-8">
          {stepIndex === STEP_INDEX.PROPERTY && <Step1Property {...stepProps} />}
          {stepIndex === STEP_INDEX.ROOFTOP && <Step2Rooftop {...stepProps} />}
          {stepIndex === STEP_INDEX.DEMAND && <Step3WaterDemand {...stepProps} />}
          {stepIndex === STEP_INDEX.ENVIRONMENT && (
            <Step4Environment
              {...stepProps}
              hasCoordinates={wizardHasCoordinates}
              environmentStates={environmentStates}
              onReloadEnvironment={reloadEnvironment}
              onEditLocation={() => goToStep(STEP_INDEX.PROPERTY)}
            />
          )}
          {stepIndex === STEP_INDEX.REVIEW && (
            <Step5Review
              draft={draft}
              rainfallError={errors.annualRainfallMm}
              onEdit={(target) => goToStep(target)}
            />
          )}
          {isResults &&
            (estimate ? (
              <Step6Results
                result={estimate}
                recommendation={recommendation}
                environmentStates={environmentStates}
                draft={draft}
                saveStatus={saveStatus}
                saveError={saveError}
                signedIn={Boolean(user)}
                onSaveToAccount={handleSaveToAccount}
                onRestart={restart}
                onBackToReview={() => goToStep(STEP_INDEX.REVIEW)}
              />
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <AlertTriangle className="mb-3 size-8 text-red-500" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-900">
                  {estimateFailed
                    ? 'Could not calculate an estimate from the provided inputs.'
                    : 'Calculating…'}
                </p>
                <button
                  type="button"
                  onClick={() => goToStep(STEP_INDEX.REVIEW)}
                  className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back to Review
                </button>
              </div>
            ))}
        </div>

        {!isResults ? (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0 || computing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={computing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
            >
              {computing ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Calculating…
                </>
              ) : isReview ? (
                <>
                  Calculate Results
                  <ChevronRight className="size-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
