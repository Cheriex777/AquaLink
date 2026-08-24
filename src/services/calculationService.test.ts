import { describe, expect, it } from 'vitest'
import {
  COLLECTION_EFFICIENCY_DEFAULT,
  DEFAULT_WATER_TARIFF_PER_KL_INR,
  calculateAnnualSavingsInr,
  calculateAssessment,
  calculateAssessmentFromDraft,
  calculateDemandCoveragePct,
  calculateHarvestLitres,
  calculateMonthlyHarvestLitres,
  calculatePaybackPeriodYears,
  calculateRunoffLitres,
  calculateWaterDemand,
  estimateRechargePotential,
  estimateSystemCost,
  getRoofMaterial,
  klToLitres,
  litresToKl,
  litresToM3,
  m3ToLitres,
  mmOverSqmToLitres,
} from './calculationService'
import { EMPTY_DRAFT, type AssessmentDraft } from '../types/assessment'

const REFERENCE = {
  roofAreaSqm: 140,
  annualRainfallMm: 1082,
  runoffCoefficient: 0.85,
}

function draftWith(overrides: Partial<AssessmentDraft>): AssessmentDraft {
  return {
    ...EMPTY_DRAFT,
    roofMaterial: 'rcc',
    roofAreaSqm: '140',
    annualRainfallMm: '1082',
    householdSize: '4',
    perCapitaLpd: '135',
    openSpaceSqm: '0',
    ...overrides,
  }
}

describe('unit conversions', () => {
  it('uses 1 mm over 1 m² = 1 litre', () => {
    expect(mmOverSqmToLitres(1, 1)).toBe(1)
    expect(mmOverSqmToLitres(1082, 140)).toBeCloseTo(151480, 6)
  })

  it('converts litres ↔ kL ↔ m³', () => {
    expect(litresToKl(1000)).toBe(1)
    expect(klToLitres(2.5)).toBe(2500)
    expect(litresToM3(7500)).toBe(7.5)
    expect(m3ToLitres(7.5)).toBe(7500)
    expect(litresToKl(0)).toBe(0)
  })

  it('rejects non-numeric conversion input', () => {
    expect(() => litresToKl(Number.NaN)).toThrow(TypeError)
    expect(() => litresToM3(Number.POSITIVE_INFINITY)).toThrow(TypeError)
  })
})

describe('runoff calculation', () => {
  it('computes raw rooftop runoff before efficiency losses', () => {
    // 140 × 1082 × 0.85
    expect(calculateRunoffLitres(REFERENCE)).toBeCloseTo(128758, 6)
  })

  it('yields zero for zero rain or zero area', () => {
    expect(calculateRunoffLitres({ ...REFERENCE, annualRainfallMm: 0 })).toBe(0)
    expect(calculateRunoffLitres({ ...REFERENCE, roofAreaSqm: 0 })).toBe(0)
  })

  it('rejects negative or out-of-range inputs', () => {
    expect(() => calculateRunoffLitres({ ...REFERENCE, roofAreaSqm: -5 })).toThrow(RangeError)
    expect(() =>
      calculateRunoffLitres({ ...REFERENCE, runoffCoefficient: 1.2 }),
    ).toThrow(RangeError)
  })
})

describe('harvest potential', () => {
  it('applies collection efficiency on top of runoff', () => {
    const harvest = calculateHarvestLitres({
      ...REFERENCE,
      collectionEfficiency: COLLECTION_EFFICIENCY_DEFAULT,
    })
    expect(harvest).toBeCloseTo(128758 * 0.9, 6)
    expect(litresToKl(harvest)).toBeCloseTo(115.8822, 4)
  })

  it('defaults efficiency to 90%', () => {
    expect(
      calculateHarvestLitres(REFERENCE) /
        calculateRunoffLitres(REFERENCE),
    ).toBeCloseTo(0.9, 12)
  })

  it('is zero when any factor is zero', () => {
    expect(calculateHarvestLitres({ ...REFERENCE, annualRainfallMm: 0 })).toBe(0)
    expect(calculateHarvestLitres({ ...REFERENCE, roofAreaSqm: 0 })).toBe(0)
    expect(calculateHarvestLitres({ ...REFERENCE, collectionEfficiency: 0 })).toBe(0)
  })

  it('produces monthly series consistent with the annual total', () => {
    const monthly = [100, 200, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const series = calculateMonthlyHarvestLitres({ ...REFERENCE, monthlyRainfallMm: monthly })
    expect(series).toHaveLength(12)
    const sum = series.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(
      calculateHarvestLitres({ ...REFERENCE, annualRainfallMm: 600 }),
      6,
    )
  })
})

describe('water demand & coverage', () => {
  it('computes daily and annual household demand', () => {
    const demand = calculateWaterDemand(4, 135)
    expect(demand.dailyLitres).toBe(540)
    expect(demand.annualLitres).toBe(197100)
  })

  it('computes coverage percentage', () => {
    const coverage = calculateDemandCoveragePct(115882.2, 197100)
    expect(coverage).toBeCloseTo(58.79, 2)
  })

  it('allows coverage above 100% for surplus roofs', () => {
    expect(calculateDemandCoveragePct(200000, 100000)).toBe(200)
  })

  it('returns 0 coverage for zero harvest', () => {
    expect(calculateDemandCoveragePct(0, 197100)).toBe(0)
  })

  it('rejects zero/negative residents or per-capita use', () => {
    expect(() => calculateWaterDemand(0, 135)).toThrow(RangeError)
    expect(() => calculateWaterDemand(4, 0)).toThrow(RangeError)
    expect(() => calculateWaterDemand(-2, 135)).toThrow(RangeError)
  })
})

describe('recharge potential', () => {
  const base = { annualHarvestLitres: 115882.2, annualDemandLitres: 197100 }

  it('reports unknown when open space is missing', () => {
    const result = estimateRechargePotential({ ...base, openSpaceSqm: null })
    expect(result.status).toBe('unknown-open-space')
    expect(result.potentialKl).toBeNull()
    expect(result.feasible).toBeNull()
  })

  it('returns zero potential with no open space', () => {
    const result = estimateRechargePotential({ ...base, openSpaceSqm: 0 })
    if (result.status !== 'assessed') throw new Error('expected assessed')
    expect(result.potentialKl).toBe(0)
    expect(result.feasible).toBe(false)
  })

  it('routes a fraction of surplus when space exists but demand exceeds harvest', () => {
    const result = estimateRechargePotential({ ...base, openSpaceSqm: 150 })
    if (result.status !== 'assessed') throw new Error('expected assessed')
    expect(result.feasible).toBe(true)
    expect(result.potentialKl).toBe(0) // no surplus → nothing to recharge
  })

  it('routes half of positive surplus to recharge', () => {
    const result = estimateRechargePotential({
      annualHarvestLitres: 400000,
      annualDemandLitres: 197100,
      openSpaceSqm: 150,
    })
    if (result.status !== 'assessed') throw new Error('expected assessed')
    expect(result.potentialKl).toBeCloseTo((400000 - 197100) / 2 / 1000, 1)
  })
})

describe('cost estimation', () => {
  it('sizes the tank from autonomy days within bounds', () => {
    const small = estimateSystemCost({
      roofAreaSqm: 60,
      dailyDemandLitres: 270,
      rechargeFeasible: false,
    })
    expect(small.tankLitres).toBe(2500) // 270 × 10 = 2700 → nearest 500

    const huge = estimateSystemCost({
      roofAreaSqm: 500,
      dailyDemandLitres: 5000,
      rechargeFeasible: false,
    })
    expect(huge.tankLitres).toBe(10000) // clamped max
  })

  it('sums breakdown into the total and skips recharge when infeasible', () => {
    const cost = estimateSystemCost({
      roofAreaSqm: 140,
      dailyDemandLitres: 540,
      rechargeFeasible: false,
    })
    expect(cost.rechargeStructureInr).toBeNull()
    expect(cost.totalInr).toBe(cost.filterInr + cost.plumbingInr + cost.tankInr)

    const withRecharge = estimateSystemCost({
      roofAreaSqm: 140,
      dailyDemandLitres: 540,
      rechargeFeasible: true,
    })
    expect(withRecharge.rechargeStructureInr).toBeGreaterThan(0)
    expect(withRecharge.totalInr - cost.totalInr).toBe(25000)
  })

  it('rejects negative areas or demand', () => {
    expect(() =>
      estimateSystemCost({ roofAreaSqm: -5, dailyDemandLitres: 100, rechargeFeasible: null }),
    ).toThrow()
    expect(() =>
      estimateSystemCost({ roofAreaSqm: 100, dailyDemandLitres: -1, rechargeFeasible: null }),
    ).toThrow()
  })
})

describe('savings & payback', () => {
  it('saves only up to the utilised volume at the tariff rate', () => {
    const savings = calculateAnnualSavingsInr({
      annualHarvestLitres: 115882.2,
      annualDemandLitres: 197100,
    })
    expect(savings.utilisedKl).toBeCloseTo(115.88, 2)
    expect(savings.savingsInr).toBe(Math.round(115.88 * DEFAULT_WATER_TARIFF_PER_KL_INR))
  })

  it('caps savings at demand even for surplus roofs', () => {
    const savings = calculateAnnualSavingsInr({
      annualHarvestLitres: 900000,
      annualDemandLitres: 197100,
    })
    expect(savings.utilisedKl).toBeCloseTo(197.1, 1)
  })

  it('supports custom tariffs', () => {
    const savings = calculateAnnualSavingsInr({
      annualHarvestLitres: 10000,
      annualDemandLitres: 20000,
      tariffPerKlInr: 50,
    })
    expect(savings.savingsInr).toBe(500)
  })

  it('computes simple payback and never divides by zero savings', () => {
    expect(calculatePaybackPeriodYears(60000, 4635)).toBeCloseTo(12.9, 1)
    expect(calculatePaybackPeriodYears(60000, 0)).toBeNull()
  })
})

describe('orchestrator', () => {
  const result = calculateAssessment({
    ...REFERENCE,
    householdSize: 4,
    perCapitaLpd: 135,
    openSpaceSqm: null,
  })

  it('keeps every section mutually consistent', () => {
    expect(result.runoff.annualLitres).toBeCloseTo(128758, 0)
    expect(result.harvest.annualKl).toBeCloseTo(115.9, 1)
    expect(result.demand.annualKl).toBeCloseTo(197.1, 1)
    expect(result.coveragePct).toBe(59)
    expect(result.recharge.status).toBe('unknown-open-space')
    expect(result.paybackYears).not.toBeNull()
    expect(result.cost.totalInr).toBeGreaterThan(0)
  })

  it('echoes assumptions used', () => {
    expect(result.input.collectionEfficiency).toBe(0.9)
    expect(result.input.runoffCoefficient).toBe(0.85)
    expect(result.savings.tariffPerKlInr).toBe(DEFAULT_WATER_TARIFF_PER_KL_INR)
  })

  it('handles all-zero volumes without crashing', () => {
    const zeros = calculateAssessment({
      roofAreaSqm: 0,
      runoffCoefficient: 0.8,
      annualRainfallMm: 0,
      householdSize: 4,
      perCapitaLpd: 135,
      openSpaceSqm: 0,
    })
    expect(zeros.harvest.annualKl).toBe(0)
    expect(zeros.coveragePct).toBe(0)
    expect(zeros.savings.annualInr).toBe(0)
    expect(zeros.paybackYears).toBeNull()
    expect(zeros.cost.plumbingInr).toBe(0)
    expect(zeros.cost.totalInr).toBe(
      zeros.cost.filterInr + zeros.cost.tankInr + (zeros.cost.rechargeStructureInr ?? 0),
    )
  })

  it('throws on structurally invalid input', () => {
    expect(() =>
      calculateAssessment({
        ...REFERENCE,
        householdSize: Number.NaN,
        perCapitaLpd: 135,
        openSpaceSqm: null,
      }),
    ).toThrow()
  })
})

describe('draft integration', () => {
  it('reproduces the Phase 3 continuity example end-to-end', () => {
    const result = calculateAssessmentFromDraft(draftWith({}))
    expect(result.harvest.annualKl).toBeCloseTo(115.9, 1)
    expect(result.demand.annualKl).toBeCloseTo(197.1, 1)
    expect(result.coveragePct).toBe(59)
  })

  it('merges overrides such as monthly rainfall into the result', () => {
    const monthly = [15, 12, 10, 8, 15, 120, 320, 310, 180, 60, 20, 12]
    const result = calculateAssessmentFromDraft(draftWith({}), { monthlyRainfallMm: monthly })
    expect(result.harvest.monthlyLitres).toHaveLength(12)
    const sum = (result.harvest.monthlyLitres ?? []).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - result.harvest.annualLitres)).toBeLessThan(5)
  })

  it('treats blank open space as unknown recharge input', () => {
    const result = calculateAssessmentFromDraft(draftWith({ openSpaceSqm: '' }))
    expect(result.recharge.status).toBe('unknown-open-space')
  })

  it('maps each material to its coefficient', () => {
    expect(getRoofMaterial('rcc')?.runoffCoefficient).toBe(0.85)
    expect(getRoofMaterial('metal_sheet')?.runoffCoefficient).toBe(0.9)
    expect(getRoofMaterial('thatch')?.runoffCoefficient).toBe(0.5)
    expect(getRoofMaterial('')).toBeUndefined()
  })

  it('throws when material is missing from the draft', () => {
    expect(() =>
      calculateAssessmentFromDraft(draftWith({ roofMaterial: '' })),
    ).toThrow(/Roof material/)
  })
})
