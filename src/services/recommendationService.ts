/**
 * Recharge recommendation engine.
 *
 * Deterministic, rule-based selection of rainwater harvesting / recharge
 * structures. Rules encode standard practice from Indian RWH guidance
 * (CGWB manual style): soil permeability and open space govern ground
 * structures; demand balance governs storage-first vs recharge-first.
 *
 * Honesty rules:
 *  - Groundwater-table depth is NOT known to the app, so recharge wells are
 *    always penalised in score, capped at LOW confidence, and carry a caveat.
 *  - Missing inputs (soil, open space) exclude affected structures rather
 *    than assuming values.
 */

export type StructureType =
  | 'recharge_pit'
  | 'recharge_trench'
  | 'recharge_well'
  | 'storage_tank'
  | 'filter_chamber'
  | 'rooftop_system'

export const STRUCTURE_LABELS: Record<StructureType, string> = {
  recharge_pit: 'Recharge pit',
  recharge_trench: 'Recharge trench',
  recharge_well: 'Recharge well',
  storage_tank: 'Storage tank',
  filter_chamber: 'Filter chamber',
  rooftop_system: 'Rooftop harvesting system',
}

export const STRUCTURE_DESCRIPTIONS: Record<StructureType, string> = {
  recharge_pit:
    'Small drilled/ dug pit (1–2 m wide, 2–3 m deep) filled with filter media that lets rooftop runoff soak into the ground.',
  recharge_trench:
    'Shallow linear pit (0.5–1 m deep) with filter media — suits larger plots where a pit is too small for the runoff.',
  recharge_well:
    'Larger dug or drilled well recharging the aquifer directly — needs space and a confirmed water-table position.',
  storage_tank:
    'Above/below-ground tank storing filtered rooftop water for direct reuse through the year.',
  filter_chamber:
    'First-flush and silt removal chamber installed between roof outlets and the tank/recharge structure.',
  rooftop_system:
    'Complete rooftop setup: gutters, downpipes, first-flush diverters and filtration feeding storage or recharge.',
}

export interface RecommendationInput {
  roofAreaSqm: number
  annualRainfallMm: number
  annualHarvestKl: number
  annualDemandKl: number
  openSpaceSqm: number | null
  soilTextureClass: string | null
  monthlyRainfallMm?: number[] | null
}

export interface Recommendation {
  structure: StructureType
  label: string
  description: string
  reason: string
  supportingFactors: string[]
  suitabilityPct: number
  confidence: 'high' | 'medium' | 'low'
}

export interface RecommendationResult {
  primary: Recommendation
  secondary: Recommendation | null
  complementary: Recommendation | null
  notes: string[]
}

type Permeability = 'high' | 'moderate' | 'low' | 'unknown'
type SpaceBand = 'unknown' | 'none' | 'small' | 'medium' | 'large'

const MIN_OPEN_SPACE_SQM = 10
const TRENCH_MIN_SPACE_SQM = 30
const WELL_MIN_SPACE_SQM = 50
const FILTER_CHAMBER_MIN_ROOF_SQM = 80
const WATER_TABLE_UNKNOWN_FACTOR = 0.7

export function deriveSoilPermeability(textureClass: string | null): Permeability {
  if (!textureClass) return 'unknown'
  const t = textureClass.toLowerCase()
  if (t.includes('sand')) return 'high'
  if (t.includes('clay') && !t.includes('loam')) return 'low'
  if (t === 'clay') return 'low'
  return 'moderate'
}

function deriveSpaceBand(openSpaceSqm: number | null): SpaceBand {
  if (openSpaceSqm === null || !Number.isFinite(openSpaceSqm)) return 'unknown'
  if (openSpaceSqm <= 0) return 'none'
  if (openSpaceSqm < MIN_OPEN_SPACE_SQM) return 'none'
  if (openSpaceSqm < TRENCH_MIN_SPACE_SQM) return 'small'
  if (openSpaceSqm < WELL_MIN_SPACE_SQM) return 'medium'
  return 'large'
}

function monsoonSharePct(monthly: number[] | null | undefined): number | null {
  if (!monthly || monthly.length !== 12) return null
  const total = monthly.reduce((sum, mm) => sum + mm, 0)
  if (total <= 0) return null
  const monsoon = monthly.slice(5, 9).reduce((sum, mm) => sum + mm, 0)
  return Math.round((monsoon / total) * 100)
}

interface Candidate {
  structure: StructureType
  score: number
  eligible: boolean
  factorNotes: string[]
}

interface SiteContext {
  input: RecommendationInput
  permeability: Permeability
  spaceBand: SpaceBand
  surplusKl: number
  surplusRatio: number
  monsoonShare: number | null
}

function buildContext(input: RecommendationInput): SiteContext {
  const surplusKl = Math.max(0, input.annualHarvestKl - input.annualDemandKl)
  const surplusRatio =
    input.annualDemandKl > 0 ? input.annualHarvestKl / input.annualDemandKl : 999
  return {
    input,
    permeability: deriveSoilPermeability(input.soilTextureClass),
    spaceBand: deriveSpaceBand(input.openSpaceSqm),
    surplusKl,
    surplusRatio,
    monsoonShare: monsoonSharePct(input.monthlyRainfallMm ?? null),
  }
}

function clampScore(score: number): number {
  return Math.max(10, Math.min(95, Math.round(score / 5) * 5))
}

function scoreCandidates(ctx: SiteContext): Candidate[] {
  const { input } = ctx
  const factors: string[] = []
  if (input.openSpaceSqm !== null) {
    factors.push(`Open space: ${input.openSpaceSqm} m²`)
  }
  if (input.soilTextureClass) {
    factors.push(`Soil: ${input.soilTextureClass} (${ctx.permeability} permeability)`)
  }
  factors.push(`Surplus after demand: ${Math.round(ctx.surplusKl * 10) / 10} kL/yr`)
  if (ctx.monsoonShare !== null) {
    factors.push(`Monsoon concentration: ${ctx.monsoonShare}% of annual rain`)
  }

  const permAdj = (base: { high: number; moderate: number; low: number; unknown: number }) =>
    base[ctx.permeability]

  const hasMeaningfulSurplus = ctx.surplusRatio > 0.9

  const pit: Candidate = (() => {
    if (!hasMeaningfulSurplus || ctx.spaceBand === 'unknown' || ctx.spaceBand === 'none') {
      return { structure: 'recharge_pit', score: 0, eligible: false, factorNotes: [] }
    }
    let score = 55
    score += ctx.spaceBand === 'small' ? 15 : ctx.spaceBand === 'medium' ? 10 : 5
    score += permAdj({ high: 20, moderate: 15, low: -35, unknown: -10 })
    if (ctx.surplusRatio >= 1.2) score += 10
    else if (ctx.surplusRatio < 0.7) score -= 15
    if (input.annualRainfallMm < 400) score -= 10
    return {
      structure: 'recharge_pit',
      score,
      eligible: score >= 35,
      factorNotes: [...factors],
    }
  })()

  const trench: Candidate = (() => {
    if (
      !hasMeaningfulSurplus ||
      ctx.spaceBand === 'unknown' ||
      ctx.spaceBand === 'none' ||
      ctx.spaceBand === 'small'
    ) {
      return { structure: 'recharge_trench', score: 0, eligible: false, factorNotes: [] }
    }
    let score = 45
    score += ctx.spaceBand === 'medium' ? 20 : 25
    score += permAdj({ high: 15, moderate: 15, low: -40, unknown: -10 })
    if (ctx.surplusRatio >= 1.2) score += 10
    else if (ctx.surplusRatio < 0.7) score -= 10
    if (ctx.monsoonShare !== null && ctx.monsoonShare >= 75) score += 5
    return {
      structure: 'recharge_trench',
      score,
      eligible: score >= 35,
      factorNotes: [...factors],
    }
  })()

  const wellRaw = (() => {
    if (!hasMeaningfulSurplus) return 0
    if (ctx.spaceBand === 'unknown' || ctx.spaceBand === 'none' || ctx.spaceBand === 'small') {
      return 0
    }
    let score = 35
    score += ctx.spaceBand === 'medium' ? 10 : 25
    score += permAdj({ high: 25, moderate: 5, low: -45, unknown: -15 })
    if (ctx.surplusRatio >= 1.5) score += 15
    else if (ctx.surplusRatio < 0.7) score -= 15
    return score
  })()
  const well: Candidate = {
    structure: 'recharge_well',
    score: wellRaw > 0 ? wellRaw * WATER_TABLE_UNKNOWN_FACTOR : 0,
    eligible: wellRaw > 0 && wellRaw * WATER_TABLE_UNKNOWN_FACTOR >= 35,
    factorNotes: [...factors],
  }

  const tank: Candidate = (() => {
    let score = 50
    score += permAdj({ high: 0, moderate: 5, low: 25, unknown: 10 })
    if (ctx.surplusRatio < 0.9) score += 20
    else if (ctx.surplusRatio > 1.5) score -= 10
    if (ctx.monsoonShare !== null && ctx.monsoonShare >= 75) score += 10
    if (input.roofAreaSqm < 40) score -= 10
    return {
      structure: 'storage_tank',
      score,
      eligible: true,
      factorNotes: [...factors],
    }
  })()

  const rooftop: Candidate = (() => {
    let score = 45
    if (ctx.spaceBand === 'none') score += 35
    if (ctx.spaceBand === 'unknown') score += 15
    score += permAdj({ high: 0, moderate: 5, low: 10, unknown: 0 })
    return {
      structure: 'rooftop_system',
      score,
      eligible: true,
      factorNotes: [...factors],
    }
  })()

  return [pit, trench, well, tank, rooftop]
}

function confidenceFor(structure: StructureType, ctx: SiteContext): 'high' | 'medium' | 'low' {
  if (structure === 'recharge_well') return 'low'
  let missing = 0
  if (ctx.permeability === 'unknown') missing += 1
  if (ctx.spaceBand === 'unknown') missing += 1
  if (ctx.monsoonShare === null) missing += 1
  if (missing >= 2) return 'low'
  if (missing === 1) return 'medium'
  return 'high'
}

function buildReason(
  structure: StructureType,
  ctx: SiteContext,
): string {
  const spaceText =
    ctx.input.openSpaceSqm !== null
      ? `${ctx.input.openSpaceSqm} m² of open space`
      : 'the available open space'
  switch (structure) {
    case 'recharge_pit':
      return `A recharge pit fits your site: ${spaceText} can host one, and ${ctx.permeability} soil lets captured water soak away.`
    case 'recharge_trench':
      return `A trench suits larger plots like yours: ${spaceText} provides the linear room a trench needs, with ${ctx.permeability} infiltration.`
    case 'recharge_well':
      return `Your plot size and ${ctx.permeability} soil could support a recharge well, but confirm the water-table depth locally first.`
    case 'storage_tank':
      return `Prioritise storage: ${
        ctx.surplusKl > 0
          ? `${Math.round(ctx.surplusKl)} kL/yr surplus remains after demand`
          : 'harvested water is fully consumed by demand'
      }, so storing treated water for direct use delivers value${ctx.permeability === 'low' ? ' on this low-permeability soil' : ''}.`
    case 'rooftop_system':
      return `Start with a complete rooftop harvesting system${
        ctx.spaceBand === 'none' ? ' — there is not enough open space for ground structures' : ''
      }; it feeds whatever storage or recharge you add later.`
    default:
      return 'Recommended based on your site conditions.'
  }
}

function toRecommendation(
  candidate: Candidate,
  ctx: SiteContext,
): Recommendation {
  return {
    structure: candidate.structure,
    label: STRUCTURE_LABELS[candidate.structure],
    description: STRUCTURE_DESCRIPTIONS[candidate.structure],
    reason: buildReason(candidate.structure, ctx),
    supportingFactors: candidate.factorNotes,
    suitabilityPct: clampScore(candidate.score),
    confidence: confidenceFor(candidate.structure, ctx),
  }
}

export function recommendRechargeStructures(
  input: RecommendationInput,
): RecommendationResult {
  const ctx = buildContext(input)
  const scored = scoreCandidates(ctx)
    .filter((candidate) => candidate.eligible)
    .sort((a, b) => b.score - a.score)

  const primaryCandidate = scored[0] ?? {
    structure: 'rooftop_system' as StructureType,
    score: 45,
    eligible: true,
    factorNotes: ['Default recommendation while site data is limited'],
  }

  const primary = toRecommendation(primaryCandidate, ctx)

  let secondary: Recommendation | null = null
  const nextCandidate = scored.find(
    (candidate) => candidate.structure !== primaryCandidate.structure,
  )
  if (nextCandidate) secondary = toRecommendation(nextCandidate, ctx)

  let complementary: Recommendation | null = null
  const wantsFilter =
    input.roofAreaSqm >= FILTER_CHAMBER_MIN_ROOF_SQM &&
    primary.structure !== 'rooftop_system' &&
    primary.structure !== 'filter_chamber' &&
    secondary?.structure !== 'filter_chamber'
  if (wantsFilter) {
    complementary = toRecommendation(
      {
        structure: 'filter_chamber',
        score: 70,
        eligible: true,
        factorNotes: [`Roof area: ${input.roofAreaSqm} m²`],
      },
      ctx,
    )
  }

  const notes: string[] = []
  const groundChosen = [primary.structure, secondary?.structure].some(
    (structure) =>
      structure === 'recharge_pit' ||
      structure === 'recharge_trench' ||
      structure === 'recharge_well',
  )
  if (groundChosen) {
    notes.push(
      'Groundwater-table depth is not yet available to this app — verify feasibility and depth with a local well-digger or hydrogeologist before construction.',
    )
  }
  if (ctx.permeability === 'unknown') {
    notes.push('Soil data was unavailable, so suitability assumes moderate infiltration.')
  }
  if (ctx.spaceBand === 'unknown') {
    notes.push('Add the open space around your building (Step 2) to unlock ground-structure recommendations.')
  }
  if (primary.structure === 'recharge_well') {
    notes.push('Recharge wells are suggested only as an option here — without water-table data their suitability cannot be confirmed.')
  }

  return { primary, secondary, complementary, notes }
}
