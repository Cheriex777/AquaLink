/**
 * JalSetu calculation engine.
 *
 * Pure, testable functions — no React, no I/O. All formulas live here and
 * nowhere else. Units are explicit in every function name; the canonical
 * conversion rule is 1 mm rainfall over 1 m² = 1 litre.
 *
 * Engineering assumptions (unit rates, fractions) are exported constants so
 * they can be audited, tested, and later refined per location.
 */

import type { AssessmentDraft } from '../types/assessment'

export const HARVEST_FORMULA =
  'Harvestable water = Roof area × Rainfall × Runoff coefficient × Collection efficiency'

/** Bumped whenever calculation semantics change; stored with saved results. */
export const ENGINE_VERSION = '1'

export const LITRES_PER_KL = 1000
export const LITRES_PER_M3 = 1000

export const COLLECTION_EFFICIENCY_DEFAULT = 0.9
export const DEFAULT_WATER_TARIFF_PER_KL_INR = 40

export const RECHARGE_ROUTING_FRACTION = 0.5
export const MIN_OPEN_SPACE_FOR_RECHARGE_SQM = 10

/**
 * JalSetu soil safety model — single source of truth.
 * Clay content at or above this percentage marks direct groundwater
 * recharge as UNSUITABLE pending professional verification.
 */
export const SOIL_CLAY_RECHARGE_THRESHOLD_PCT = 35

/**
 * First-flush diversion: divert the first 0.5 mm of rainfall over the roof
 * (≈ 0.5 L per m²) before harvesting, discarding dust/debris wash-off.
 */
export const FIRST_FLUSH_DIVERSION_MM = 0.5

export const FIRST_FLUSH_FILTER_COST_INR = 6000
export const PLUMBING_COST_PER_SQM_INR = 40
export const TANK_COST_PER_LITRE_INR = 12
export const RECHARGE_STRUCTURE_BASE_COST_INR = 25000

export const TANK_AUTONOMY_DAYS = 10
export const TANK_MIN_LITRES = 500
export const TANK_MAX_LITRES = 10000
export const TANK_ROUND_TO_LITRES = 500

export interface RoofMaterialOption {
  value: 'rcc' | 'metal_sheet' | 'clay_tile' | 'thatch' | 'other'
  label: string
  runoffCoefficient: number
}

export const ROOF_MATERIAL_OPTIONS: RoofMaterialOption[] = [
  { value: 'rcc', label: 'RCC / Concrete', runoffCoefficient: 0.85 },
  { value: 'metal_sheet', label: 'Metal sheet', runoffCoefficient: 0.9 },
  { value: 'clay_tile', label: 'Clay tile', runoffCoefficient: 0.8 },
  { value: 'thatch', label: 'Thatch', runoffCoefficient: 0.5 },
  { value: 'other', label: 'Other', runoffCoefficient: 0.75 },
]

export function getRoofMaterial(
  value: AssessmentDraft['roofMaterial'],
): RoofMaterialOption | undefined {
  return ROOF_MATERIAL_OPTIONS.find((option) => option.value === value)
}

/* ------------------------------------------------------------------ */
/* Unit conversions                                                    */
/* ------------------------------------------------------------------ */

export function litresToKl(litres: number): number {
  assertFinite('litres', litres)
  return litres / LITRES_PER_KL
}

export function klToLitres(kl: number): number {
  assertFinite('kl', kl)
  return kl * LITRES_PER_KL
}

export function litresToM3(litres: number): number {
  assertFinite('litres', litres)
  return litres / LITRES_PER_M3
}

export function m3ToLitres(m3: number): number {
  assertFinite('m3', m3)
  return m3 * LITRES_PER_M3
}

/** Core rule: 1 mm of rain over 1 m² of surface yields 1 litre. */
export function mmOverSqmToLitres(mm: number, sqm: number): number {
  assertFinite('mm', mm)
  assertFinite('sqm', sqm)
  return mm * sqm
}

/* ------------------------------------------------------------------ */
/* Core calculations                                                   */
/* ------------------------------------------------------------------ */

export function calculateRunoffLitres(params: {
  roofAreaSqm: number
  annualRainfallMm: number
  runoffCoefficient: number
}): number {
  const { roofAreaSqm, annualRainfallMm, runoffCoefficient } = params
  assertNonNegative('roofAreaSqm', roofAreaSqm)
  assertNonNegative('annualRainfallMm', annualRainfallMm)
  assertRange('runoffCoefficient', runoffCoefficient, 0, 1)
  return mmOverSqmToLitres(annualRainfallMm, roofAreaSqm) * runoffCoefficient
}

export function calculateHarvestLitres(params: {
  roofAreaSqm: number
  annualRainfallMm: number
  runoffCoefficient: number
  collectionEfficiency?: number
}): number {
  const efficiency = params.collectionEfficiency ?? COLLECTION_EFFICIENCY_DEFAULT
  assertRange('collectionEfficiency', efficiency, 0, 1)
  return (
    calculateRunoffLitres({
      roofAreaSqm: params.roofAreaSqm,
      annualRainfallMm: params.annualRainfallMm,
      runoffCoefficient: params.runoffCoefficient,
    }) * efficiency
  )
}

export function calculateMonthlyHarvestLitres(params: {
  monthlyRainfallMm: number[]
  roofAreaSqm: number
  runoffCoefficient: number
  collectionEfficiency?: number
}): number[] {
  return params.monthlyRainfallMm.map((mm) =>
    calculateHarvestLitres({
      roofAreaSqm: params.roofAreaSqm,
      annualRainfallMm: mm,
      runoffCoefficient: params.runoffCoefficient,
      collectionEfficiency: params.collectionEfficiency,
    }),
  )
}

/** Household demand over a year (and its daily average). */
export function calculateWaterDemand(householdSize: number, perCapitaLpd: number): {
  dailyLitres: number
  annualLitres: number
} {
  assertPositive('householdSize', householdSize)
  assertPositive('perCapitaLpd', perCapitaLpd)
  const dailyLitres = householdSize * perCapitaLpd
  return { dailyLitres, annualLitres: dailyLitres * 365 }
}

/** Share of demand met by harvest. Not clamped — surplus roofs exceed 100%. */
export function calculateDemandCoveragePct(
  harvestLitres: number,
  demandLitres: number,
): number {
  assertNonNegative('harvestLitres', harvestLitres)
  if (demandLitres === 0) return 0
  assertPositive('demandLitres', demandLitres)
  return (harvestLitres / demandLitres) * 100
}

/* ------------------------------------------------------------------ */
/* Recharge potential                                                  */
/* ------------------------------------------------------------------ */

export type RechargeAssessment =
  | {
      status: 'assessed'
      potentialKl: number
      feasible: boolean
      routingFraction: number
    }
  | { status: 'unknown-open-space'; potentialKl: null; feasible: null; note: string }

export function estimateRechargePotential(params: {
  annualHarvestLitres: number
  annualDemandLitres: number
  openSpaceSqm: number | null
}): RechargeAssessment {
  const { annualHarvestLitres, annualDemandLitres } = params
  assertNonNegative('annualHarvestLitres', annualHarvestLitres)
  assertNonNegative('annualDemandLitres', annualDemandLitres)

  if (params.openSpaceSqm === null || params.openSpaceSqm === undefined) {
    return {
      status: 'unknown-open-space',
      potentialKl: null,
      feasible: null,
      note: 'Enter the open space around the building to assess recharge potential.',
    }
  }

  const openSpaceSqm = params.openSpaceSqm
  assertNonNegative('openSpaceSqm', openSpaceSqm)

  const feasible = openSpaceSqm >= MIN_OPEN_SPACE_FOR_RECHARGE_SQM && openSpaceSqm > 0
  const surplusLitres = Math.max(0, annualHarvestLitres - annualDemandLitres)
  const routedLitres = openSpaceSqm > 0 ? surplusLitres * RECHARGE_ROUTING_FRACTION : 0

  return {
    status: 'assessed',
    potentialKl: round(litresToKl(routedLitres), 1),
    feasible,
    routingFraction: RECHARGE_ROUTING_FRACTION,
  }
}

/* ------------------------------------------------------------------ */
/* Costing                                                             */
/* ------------------------------------------------------------------ */

function roundTankSize(dailyDemandLitres: number): number {
  const ideal = dailyDemandLitres * TANK_AUTONOMY_DAYS
  const rounded = Math.round(ideal / TANK_ROUND_TO_LITRES) * TANK_ROUND_TO_LITRES
  return Math.min(TANK_MAX_LITRES, Math.max(TANK_MIN_LITRES, rounded))
}

export interface SystemCostBreakdown {
  filterInr: number
  plumbingInr: number
  tankLitres: number
  tankInr: number
  rechargeStructureInr: number | null
  totalInr: number
}

export function estimateSystemCost(params: {
  roofAreaSqm: number
  dailyDemandLitres: number
  rechargeFeasible: boolean | null
}): SystemCostBreakdown {
  assertNonNegative('roofAreaSqm', params.roofAreaSqm)
  assertNonNegative('dailyDemandLitres', params.dailyDemandLitres)

  const filterInr = FIRST_FLUSH_FILTER_COST_INR
  const plumbingInr = round(params.roofAreaSqm * PLUMBING_COST_PER_SQM_INR, 0)
  const tankLitres = roundTankSize(params.dailyDemandLitres)
  const tankInr = tankLitres * TANK_COST_PER_LITRE_INR
  const rechargeStructureInr = params.rechargeFeasible
    ? RECHARGE_STRUCTURE_BASE_COST_INR
    : null

  const totalInr =
    filterInr +
    plumbingInr +
    tankInr +
    (rechargeStructureInr ?? 0)

  return {
    filterInr,
    plumbingInr,
    tankLitres,
    tankInr,
    rechargeStructureInr,
    totalInr: Math.round(totalInr),
  }
}

/* ------------------------------------------------------------------ */
/* Savings & payback                                                   */
/* ------------------------------------------------------------------ */

export function calculateAnnualSavingsInr(params: {
  annualHarvestLitres: number
  annualDemandLitres: number
  tariffPerKlInr?: number
}): { utilisedKl: number; savingsInr: number } {
  const tariff = params.tariffPerKlInr ?? DEFAULT_WATER_TARIFF_PER_KL_INR
  assertNonNegative('tariffPerKlInr', tariff)

  const utilisedLitres = Math.min(params.annualHarvestLitres, params.annualDemandLitres)
  const utilisedKl = round(litresToKl(utilisedLitres), 2)
  return { utilisedKl, savingsInr: Math.round(utilisedKl * tariff) }
}

/** Simple payback. Returns null when savings never recover the cost. */
export function calculatePaybackPeriodYears(
  totalCostInr: number,
  annualSavingsInr: number,
): number | null {
  assertNonNegative('totalCostInr', totalCostInr)
  assertNonNegative('annualSavingsInr', annualSavingsInr)
  if (annualSavingsInr <= 0) return null
  return Math.round((totalCostInr / annualSavingsInr) * 10) / 10
}

/* ------------------------------------------------------------------ */
/* Engineering sizing (advisory layer — does not change cost engine)  */
/* ------------------------------------------------------------------ */

/**
 * Standard Indian market tank sizes in litres.
 * Used to pick the smallest catalogue size that meets the calculated need.
 */
export const STANDARD_TANK_SIZES_L: readonly number[] = [
  500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000,
]

/** Default storage autonomy target for engineering sizing advice. */
export const ENGINEERING_TARGET_STORAGE_DAYS = 12

/**
 * Assumed saturated hydraulic conductivity (Ksat) for non-clay soils.
 * 25 mm/hr is representative of sandy loam / loam — used only when no
 * site-measured value is available. Clearly labelled as assumed in output.
 */
export const ASSUMED_INFILTRATION_RATE_MM_HR = 25

/** Typical Indian monsoon rainy-day count used in recharge sizing. */
export const ASSUMED_RAINY_DAYS_PER_YEAR = 60

export interface EngineerTankResult {
  dailyDemandLitres: number
  targetDays: number
  calculatedLitres: number
  /** Smallest standard catalogue size ≥ calculatedLitres. */
  recommendedLitres: number
  tankType: 'PVC/HDPE overhead' | 'HDPE ground-level' | 'Underground RCC'
  sizingNote: string
}

/**
 * Picks the smallest standard tank size that covers dailyDemand × targetDays.
 * Tank type is inferred from volume; overhead tanks suit small systems while
 * large volumes need ground-level or underground RCC construction.
 */
export function engineerTankCapacity(
  dailyDemandLitres: number,
  targetDays: number = ENGINEERING_TARGET_STORAGE_DAYS,
): EngineerTankResult {
  assertNonNegative('dailyDemandLitres', dailyDemandLitres)
  assertPositive('targetDays', targetDays)

  const calculatedLitres = dailyDemandLitres * targetDays
  const recommendedLitres =
    STANDARD_TANK_SIZES_L.find((size) => size >= calculatedLitres) ??
    STANDARD_TANK_SIZES_L[STANDARD_TANK_SIZES_L.length - 1]

  const tankType: EngineerTankResult['tankType'] =
    recommendedLitres <= 5000
      ? 'PVC/HDPE overhead'
      : recommendedLitres <= 15000
        ? 'HDPE ground-level'
        : 'Underground RCC'

  const actualDays =
    dailyDemandLitres > 0
      ? Math.round((recommendedLitres / dailyDemandLitres) * 10) / 10
      : targetDays

  const sizingNote =
    `Recommended storage: ${recommendedLitres.toLocaleString('en-IN')} L` +
    ` (approximately ${actualDays} days of household demand).`

  return {
    dailyDemandLitres,
    targetDays,
    calculatedLitres: Math.round(calculatedLitres),
    recommendedLitres,
    tankType,
    sizingNote,
  }
}

export interface RechargeStructureSizing {
  feasible: boolean
  reason: string
  structureType: 'recharge_pit' | 'recharge_trench' | null
  /** Diameter in metres for a pit; null for trench. */
  diameterM: number | null
  /** Length in metres for a trench; null for pit. */
  lengthM: number | null
  /** Width in metres for a trench (fixed at 1 m); null for pit. */
  widthM: number | null
  depthM: number | null
  estimatedRechargeM3: number | null
  /** Human-readable soil source used for this sizing. */
  soilBasis: string
  filterMediaLayers: string[]
  limitationNote: string
}

const RECHARGE_PIT_DEPTH_M = 2.0
const RECHARGE_TRENCH_DEPTH_M = 1.5
const RECHARGE_TRENCH_WIDTH_M = 1.0
const FILTER_MEDIA_STANDARD = ['Gravel (bottom layer)', 'Coarse sand', 'Fine sand (top layer)']

/**
 * Derives advisory recharge structure dimensions from the surplus volume,
 * soil permeability, and open space. All outputs are clearly labelled as
 * feasibility-level estimates — site Ksat testing is always required.
 *
 * Decision rules follow CGWB manual conventions:
 * - Clay ≥ 35 % → UNSAFE, recommend storage only.
 * - Open space < 10 m² → not enough room.
 * - Surplus ≤ 0 → nothing to recharge.
 * - Open space < 30 m² → recharge pit; ≥ 30 m² → recharge trench.
 */
export function engineerRechargeStructure(params: {
  surplusKl: number
  openSpaceSqm: number | null
  annualRainfallMm: number
  clayPct: number | null
  rechargeSafetyStatus: RechargeSafetyStatus
  soilBasis: string
}): RechargeStructureSizing {
  const { surplusKl, openSpaceSqm, rechargeSafetyStatus, soilBasis } = params

  const limitationNote =
    'Dimensions are feasibility-level estimates only. ' +
    'Site infiltration testing (in-situ Ksat measurement) and a groundwater ' +
    'depth assessment are required before construction.'

  if (rechargeSafetyStatus === 'UNSAFE') {
    return {
      feasible: false,
      reason:
        `Clay content ≥ ${SOIL_CLAY_RECHARGE_THRESHOLD_PCT}% — direct groundwater recharge ` +
        'is not recommended on this soil. Prioritise storage.',
      structureType: null,
      diameterM: null, lengthM: null, widthM: null, depthM: null,
      estimatedRechargeM3: null,
      soilBasis,
      filterMediaLayers: [],
      limitationNote,
    }
  }

  if (openSpaceSqm === null) {
    return {
      feasible: false,
      reason: 'Open space not provided — enter the area around the building to assess recharge.',
      structureType: null,
      diameterM: null, lengthM: null, widthM: null, depthM: null,
      estimatedRechargeM3: null,
      soilBasis,
      filterMediaLayers: [],
      limitationNote,
    }
  }

  if (openSpaceSqm < MIN_OPEN_SPACE_FOR_RECHARGE_SQM) {
    return {
      feasible: false,
      reason: `Insufficient open space (${openSpaceSqm} m² — need at least ${MIN_OPEN_SPACE_FOR_RECHARGE_SQM} m²).`,
      structureType: null,
      diameterM: null, lengthM: null, widthM: null, depthM: null,
      estimatedRechargeM3: null,
      soilBasis,
      filterMediaLayers: [],
      limitationNote,
    }
  }

  if (surplusKl <= 0) {
    return {
      feasible: false,
      reason: 'No annual surplus after household demand — full harvest is consumed. Prioritise storage.',
      structureType: null,
      diameterM: null, lengthM: null, widthM: null, depthM: null,
      estimatedRechargeM3: null,
      soilBasis,
      filterMediaLayers: [],
      limitationNote,
    }
  }

  // Volume to route to ground (50% of surplus, matching RECHARGE_ROUTING_FRACTION)
  const targetRechargeM3 =
    round((surplusKl * RECHARGE_ROUTING_FRACTION * LITRES_PER_KL) / LITRES_PER_M3, 2)

  // Area needed = target volume ÷ effective infiltration depth over the season
  // infiltration depth (m) = Ksat (m/hr) × rainy hours
  const rainyHours = ASSUMED_RAINY_DAYS_PER_YEAR * 24
  const ksatMPerHr = ASSUMED_INFILTRATION_RATE_MM_HR / 1000
  const infiltrationDepthM = ksatMPerHr * rainyHours
  const areaNeededM2 = infiltrationDepthM > 0
    ? Math.min(targetRechargeM3 / infiltrationDepthM, openSpaceSqm)
    : openSpaceSqm

  if (openSpaceSqm < 30) {
    // Recharge pit: circular plan, fixed depth
    const pitAreaM2 = Math.min(areaNeededM2, Math.PI * ((openSpaceSqm / Math.PI) ** 0.5) ** 2)
    const radiusM = Math.sqrt(pitAreaM2 / Math.PI)
    const diameterM = Math.max(0.5, round(Math.ceil(radiusM * 2 / 0.5) * 0.5, 1))
    const actualVolumeM3 = round(Math.PI * (diameterM / 2) ** 2 * RECHARGE_PIT_DEPTH_M, 2)

    return {
      feasible: true,
      reason: `Recharge pit fits the available open space (${openSpaceSqm} m²).`,
      structureType: 'recharge_pit',
      diameterM,
      lengthM: null,
      widthM: null,
      depthM: RECHARGE_PIT_DEPTH_M,
      estimatedRechargeM3: actualVolumeM3,
      soilBasis,
      filterMediaLayers: FILTER_MEDIA_STANDARD,
      limitationNote,
    }
  }

  // Recharge trench: 1 m wide, length = available space ÷ 1 m width (capped)
  const maxLengthM = Math.floor(openSpaceSqm / RECHARGE_TRENCH_WIDTH_M)
  const neededLengthM = Math.ceil(areaNeededM2 / RECHARGE_TRENCH_WIDTH_M)
  const lengthM = Math.max(2, Math.min(neededLengthM, maxLengthM))
  const actualVolumeM3 = round(lengthM * RECHARGE_TRENCH_WIDTH_M * RECHARGE_TRENCH_DEPTH_M, 2)

  return {
    feasible: true,
    reason: `Recharge trench suits the larger plot (${openSpaceSqm} m² open space).`,
    structureType: 'recharge_trench',
    diameterM: null,
    lengthM,
    widthM: RECHARGE_TRENCH_WIDTH_M,
    depthM: RECHARGE_TRENCH_DEPTH_M,
    estimatedRechargeM3: actualVolumeM3,
    soilBasis,
    filterMediaLayers: FILTER_MEDIA_STANDARD,
    limitationNote,
  }
}

export interface EngineeringSizingResult {
  tank: EngineerTankResult
  recharge: RechargeStructureSizing
}

/**
 * Top-level orchestrator for engineering sizing advice.
 * Derives all values from current assessment data — no hardcoded outputs.
 */
export function calculateEngineeringSizing(params: {
  dailyDemandLitres: number
  surplusKl: number
  openSpaceSqm: number | null
  annualRainfallMm: number
  clayPct: number | null
  soilBasis: string
  rechargeSafetyStatus: RechargeSafetyStatus
}): EngineeringSizingResult {
  return {
    tank: engineerTankCapacity(params.dailyDemandLitres),
    recharge: engineerRechargeStructure({
      surplusKl: params.surplusKl,
      openSpaceSqm: params.openSpaceSqm,
      annualRainfallMm: params.annualRainfallMm,
      clayPct: params.clayPct,
      rechargeSafetyStatus: params.rechargeSafetyStatus,
      soilBasis: params.soilBasis,
    }),
  }
}

/* ------------------------------------------------------------------ */
/* Soil safety gate                                                    */
/* ------------------------------------------------------------------ */

export type RechargeSafetyStatus = 'SAFE' | 'CAUTION' | 'UNSAFE' | 'NOT_ASSESSED'

export interface RechargeSafetyAssessment {
  status: RechargeSafetyStatus
  headline: string
  explanation: string
}

const CAUTION_TEXTURES = ['clay loam', 'silty clay loam', 'sandy clay loam']

/**
 * Derives the recharge safety status from the best available soil estimate.
 * Uses clay percentage when present, otherwise falls back to the texture
 * class. Wording is deliberately cautious — this is a screening model.
 */
export function deriveRechargeSafety(params: {
  clayPct?: number | null
  textureClass?: string | null
}): RechargeSafetyAssessment {
  const { clayPct, textureClass } = params

  if (typeof clayPct === 'number' && Number.isFinite(clayPct) && clayPct >= 0) {
    if (clayPct < 25) {
      return {
        status: 'SAFE',
        headline: `${Math.round(clayPct)}% clay`,
        explanation:
          'Based on the available soil estimate, groundwater recharge appears potentially suitable.',
      }
    }
    if (clayPct <= SOIL_CLAY_RECHARGE_THRESHOLD_PCT) {
      return {
        status: 'CAUTION',
        headline: `${Math.round(clayPct)}% clay`,
        explanation:
          `Based on the available soil estimate, recharge may work but infiltration could be slow — treat as CAUTION near the ${SOIL_CLAY_RECHARGE_THRESHOLD_PCT}% threshold.`,
      }
    }
    return {
      status: 'UNSAFE',
      headline: `${Math.round(clayPct)}% clay`,
      explanation:
        'Based on the available soil estimate, direct groundwater recharge may be unsuitable — prioritise storage and verify the site with a qualified professional.',
    }
  }

  if (textureClass && textureClass.trim()) {
    const t = textureClass.trim().toLowerCase()
    if (t === 'clay' || t === 'sandy clay' || t === 'silty clay') {
      return {
        status: 'UNSAFE',
        headline: textureClass,
        explanation:
          'Based on the available soil estimate (high-clay texture), direct groundwater recharge may be unsuitable — prioritise storage and verify the site professionally.',
      }
    }
    if (CAUTION_TEXTURES.some((candidate) => t.includes(candidate))) {
      return {
        status: 'CAUTION',
        headline: textureClass,
        explanation:
          'Based on the available soil estimate, recharge may work but infiltration could be slow — treat as CAUTION and monitor performance.',
      }
    }
    return {
      status: 'SAFE',
      headline: textureClass,
      explanation:
        'Based on the available soil estimate, groundwater recharge appears potentially suitable.',
    }
  }

  return {
    status: 'NOT_ASSESSED',
    headline: 'Not assessed',
    explanation:
      'Soil information was unavailable for this location, so recharge safety could not be assessed. Enter your state/city or provide a soil texture to enable it.',
  }
}

/** First-flush diversion volume in litres for a given roof area. */
export function firstFlushLitres(roofAreaSqm: number): number {
  assertNonNegative('roofAreaSqm', roofAreaSqm)
  return Math.round(mmOverSqmToLitres(roofAreaSqm, FIRST_FLUSH_DIVERSION_MM))
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export interface AssessmentInput {
  roofAreaSqm: number
  runoffCoefficient: number
  collectionEfficiency?: number
  annualRainfallMm: number
  householdSize: number
  perCapitaLpd: number
  openSpaceSqm: number | null
  monthlyRainfallMm?: number[]
}

export interface CalculationResult {
  input: Required<Pick<AssessmentInput, 'roofAreaSqm' | 'runoffCoefficient'>> & {
    collectionEfficiency: number
    annualRainfallMm: number
  }
  runoff: {
    annualLitres: number
    annualKl: number
  }
  harvest: {
    annualLitres: number
    annualKl: number
    monthlyLitres: number[] | null
  }
  demand: {
    dailyLitres: number
    annualLitres: number
    annualKl: number
  }
  coveragePct: number
  recharge: RechargeAssessment
  cost: SystemCostBreakdown
  savings: {
    utilisedKl: number
    annualInr: number
    tariffPerKlInr: number
  }
  paybackYears: number | null
}

function buildInputFromDraft(draft: AssessmentDraft): AssessmentInput {
  const material = getRoofMaterial(draft.roofMaterial)
  if (!material) {
    throw new Error('Roof material must be selected before calculating.')
  }
  const roofAreaSqm = Number(draft.roofAreaSqm.trim())
  const annualRainfallMm = Number(draft.annualRainfallMm.trim())
  const householdSize = Number(draft.householdSize.trim())
  const perCapitaLpd = Number(draft.perCapitaLpd.trim())
  const openSpaceTrimmed = draft.openSpaceSqm.trim()
  const openSpaceSqm = openSpaceTrimmed === '' ? null : Number(openSpaceTrimmed)

  return {
    roofAreaSqm,
    runoffCoefficient: material.runoffCoefficient,
    annualRainfallMm,
    householdSize,
    perCapitaLpd,
    openSpaceSqm: openSpaceSqm !== null && Number.isFinite(openSpaceSqm) && openSpaceSqm >= 0
      ? openSpaceSqm
      : null,
  }
}

export function calculateAssessmentFromDraft(
  draft: AssessmentDraft,
  overrides?: Partial<AssessmentInput>,
): CalculationResult {
  const base = buildInputFromDraft(draft)
  const merged: AssessmentInput = { ...base, ...overrides }
  return calculateAssessment(merged)
}

export function calculateAssessment(input: AssessmentInput): CalculationResult {
  const collectionEfficiency = input.collectionEfficiency ?? COLLECTION_EFFICIENCY_DEFAULT

  const runoffAnnualLitres = calculateRunoffLitres(input)
  const harvestAnnualLitres = calculateHarvestLitres({ ...input, collectionEfficiency })
  const monthlyHarvest = input.monthlyRainfallMm
    ? calculateMonthlyHarvestLitres({
        monthlyRainfallMm: input.monthlyRainfallMm,
        roofAreaSqm: input.roofAreaSqm,
        runoffCoefficient: input.runoffCoefficient,
        collectionEfficiency,
      })
    : null

  const demand = calculateWaterDemand(input.householdSize, input.perCapitaLpd)
  const coveragePct = calculateDemandCoveragePct(harvestAnnualLitres, demand.annualLitres)

  const recharge = estimateRechargePotential({
    annualHarvestLitres: harvestAnnualLitres,
    annualDemandLitres: demand.annualLitres,
    openSpaceSqm: input.openSpaceSqm,
  })

  const rechargeFeasible = recharge.status === 'assessed' ? recharge.feasible : null
  const cost = estimateSystemCost({
    roofAreaSqm: input.roofAreaSqm,
    dailyDemandLitres: demand.dailyLitres,
    rechargeFeasible,
  })

  const savings = calculateAnnualSavingsInr({
    annualHarvestLitres: harvestAnnualLitres,
    annualDemandLitres: demand.annualLitres,
  })
  const paybackYears = calculatePaybackPeriodYears(cost.totalInr, savings.savingsInr)
  return {
    input: {
      roofAreaSqm: input.roofAreaSqm,
      runoffCoefficient: input.runoffCoefficient,
      collectionEfficiency,
      annualRainfallMm: input.annualRainfallMm,
    },
    runoff: {
      annualLitres: round(runoffAnnualLitres, 0),
      annualKl: round(litresToKl(runoffAnnualLitres), 1),
    },
    harvest: {
      annualLitres: round(harvestAnnualLitres, 0),
      annualKl: round(litresToKl(harvestAnnualLitres), 1),
      monthlyLitres: monthlyHarvest?.map((litres) => round(litres, 1)) ?? null,
    },
    demand: {
      dailyLitres: round(demand.dailyLitres, 1),
      annualLitres: round(demand.annualLitres, 0),
      annualKl: round(litresToKl(demand.annualLitres), 1),
    },
    coveragePct: Math.round(coveragePct),
    recharge,
    cost,
    savings: {
      utilisedKl: savings.utilisedKl,
      annualInr: savings.savingsInr,
      tariffPerKlInr: DEFAULT_WATER_TARIFF_PER_KL_INR,
    },
    paybackYears,
  }
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function assertFinite(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number (got ${String(value)}).`)
  }
}

function assertNonNegative(name: string, value: number): void {
  assertFinite(name, value)
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative (got ${value}).`)
  }
}

function assertPositive(name: string, value: number): void {
  assertFinite(name, value)
  if (value <= 0) {
    throw new RangeError(`${name} must be greater than 0 (got ${value}).`)
  }
}

function assertRange(name: string, value: number, min: number, max: number): void {
  assertFinite(name, value)
  if (value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max} (got ${value}).`)
  }
}
