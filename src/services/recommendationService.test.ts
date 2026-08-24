import { describe, expect, it } from 'vitest'
import {
  deriveSoilPermeability,
  recommendRechargeStructures,
  type RecommendationInput,
} from './recommendationService'

function scenario(overrides: Partial<RecommendationInput>): RecommendationInput {
  return {
    roofAreaSqm: 140,
    annualRainfallMm: 1082,
    annualHarvestKl: 115.9,
    annualDemandKl: 197.1,
    openSpaceSqm: 150,
    soilTextureClass: 'Loam',
    monthlyRainfallMm: [15, 12, 10, 8, 15, 120, 320, 310, 180, 60, 20, 12],
    ...overrides,
  }
}

describe('soil permeability derivation', () => {
  it('maps texture classes to permeability bands', () => {
    expect(deriveSoilPermeability('Sand')).toBe('high')
    expect(deriveSoilPermeability('Sandy loam')).toBe('high')
    expect(deriveSoilPermeability('Clay')).toBe('low')
    expect(deriveSoilPermeability('Silty clay')).toBe('low')
    expect(deriveSoilPermeability('Clay loam')).toBe('moderate')
    expect(deriveSoilPermeability('Loam')).toBe('moderate')
    expect(deriveSoilPermeability(null)).toBe('unknown')
  })
})

describe('scenario: sandy soil + large plot + strong surplus', () => {
  const input = scenario({
    soilTextureClass: 'Sandy loam',
    openSpaceSqm: 200,
    annualHarvestKl: 300,
    annualDemandKl: 150,
  })
  const result = recommendRechargeStructures(input)

  it('recommends a ground recharge structure first', () => {
    expect(['recharge_trench', 'recharge_pit']).toContain(result.primary.structure)
    expect(result.primary.suitabilityPct).toBeGreaterThanOrEqual(70)
  })

  it('offers a well only with low confidence and a water-table caveat', () => {
    const well = [result.primary, result.secondary].find(
      (r) => r?.structure === 'recharge_well',
    )
    if (well) {
      expect(well.confidence).toBe('low')
      expect(
        result.notes.some((note) => note.toLowerCase().includes('water')),
      ).toBe(true)
    }
  })

  it('cites the relevant site factors', () => {
    expect(result.primary.supportingFactors.join(' ')).toMatch(/Open space/)
    expect(result.primary.supportingFactors.join(' ')).toMatch(/Soil/)
    expect(result.primary.reason.length).toBeGreaterThan(20)
  })
})

describe('scenario: clay soil (low permeability)', () => {
  const result = recommendRechargeStructures(scenario({ soilTextureClass: 'Clay' }))

  it('prioritises storage over ground recharge', () => {
    expect(result.primary.structure).toBe('storage_tank')
  })

  it('excludes or heavily penalises pits and trenches', () => {
    const pitOrTrench = [result.primary, result.secondary].filter(
      (r) => r?.structure === 'recharge_pit' || r?.structure === 'recharge_trench',
    )
    for (const rec of pitOrTrench) {
      if (!rec) continue
      expect(rec.confidence).not.toBe('high')
    }
  })
})

describe('scenario: no open space', () => {
  const result = recommendRechargeStructures(scenario({ openSpaceSqm: null }))

  it('falls back to rooftop-first recommendations', () => {
    expect(['rooftop_system', 'storage_tank']).toContain(result.primary.structure)
  })

  it('never recommends ground structures when space is unknown', () => {
    const structures = [
      result.primary.structure,
      result.secondary?.structure,
      result.complementary?.structure,
    ]
    expect(structures).not.toContain('recharge_pit')
    expect(structures).not.toContain('recharge_trench')
    expect(structures).not.toContain('recharge_well')
    expect(result.notes.some((note) => note.includes('open space'))).toBe(true)
  })
})

describe('scenario: zero open space', () => {
  const result = recommendRechargeStructures(scenario({ openSpaceSqm: 0 }))
  it('also avoids ground structures', () => {
    const structures = [
      result.primary.structure,
      result.secondary?.structure,
    ]
    expect(structures).not.toContain('recharge_pit')
    expect(structures).not.toContain('recharge_trench')
  })
})

describe('scenario: small yard with surplus → pit over trench', () => {
  const result = recommendRechargeStructures(
    scenario({
      openSpaceSqm: 15,
      annualHarvestKl: 260,
      annualDemandKl: 190,
    }),
  )
  it('selects the compact structure', () => {
    expect(result.primary.structure).toBe('recharge_pit')
  })
  it('does not propose a trench in a tiny yard', () => {
    expect([result.primary.structure, result.secondary?.structure]).not.toContain(
      'recharge_trench',
    )
  })
})

describe('scenario: demand exceeds harvest → storage-led', () => {
  const result = recommendRechargeStructures(
    scenario({
      annualHarvestKl: 90,
      annualDemandKl: 250,
      soilTextureClass: 'Sandy loam',
    }),
  )
  it('prioritises the storage tank', () => {
    expect(['storage_tank', 'rooftop_system']).toContain(result.primary.structure)
  })
  it('excludes ground recharge entirely without surplus water', () => {
    const structures = [
      result.primary.structure,
      result.secondary?.structure,
      result.complementary?.structure,
    ]
    expect(structures).not.toContain('recharge_pit')
    expect(structures).not.toContain('recharge_trench')
    expect(structures).not.toContain('recharge_well')
  })
})

describe('complementary filter chamber', () => {
  it('appears for large roofs with recharge structures', () => {
    const result = recommendRechargeStructures(
      scenario({
        roofAreaSqm: 200,
        soilTextureClass: 'Sandy loam',
        annualHarvestKl: 300,
        annualDemandKl: 150,
      }),
    )
    expect(result.complementary?.structure ?? result.secondary?.structure).toBeDefined()
    if (result.complementary) {
      expect(result.complementary.structure).toBe('filter_chamber')
    }
  })

  it('is skipped for small roofs', () => {
    const result = recommendRechargeStructures(
      scenario({ roofAreaSqm: 60, annualHarvestKl: 50, annualDemandKl: 100 }),
    )
    expect(result.complementary).toBeNull()
  })
})

describe('behavioural guarantees', () => {
  it('produces different primary recommendations for different sites', () => {
    const a = recommendRechargeStructures(
      scenario({ soilTextureClass: 'Sandy loam', annualHarvestKl: 300, annualDemandKl: 150 }),
    )
    const b = recommendRechargeStructures(scenario({ soilTextureClass: 'Clay' }))
    expect(a.primary.structure).not.toBe(b.primary.structure)
  })

  it('is deterministic for identical inputs', () => {
    const input = scenario({})
    expect(recommendRechargeStructures(input)).toEqual(recommendRechargeStructures(input))
  })

  it('keeps suitability within bounds and lowers confidence with missing data', () => {
    const rich = recommendRechargeStructures(scenario({}))
    const sparse = recommendRechargeStructures(
      scenario({ soilTextureClass: null, monthlyRainfallMm: null }),
    )
    for (const rec of [rich.primary, rich.secondary, sparse.primary]) {
      if (!rec) continue
      expect(rec.suitabilityPct).toBeLessThanOrEqual(95)
      expect(rec.suitabilityPct).toBeGreaterThanOrEqual(10)
    }
    expect(sparse.primary.confidence === 'medium' || sparse.primary.confidence === 'low').toBe(
      true,
    )
  })
})
