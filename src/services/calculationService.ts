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
