/**
 * Effective-soil resolver — single place that decides which soil estimate
 * applies to an assessment and how it must be labelled.
 *
 * Precedence: user-provided override → live SoilGrids → regional fallback
 * → not assessed. Provenance labels are exact strings rendered in the UI,
 * saved snapshots and reports.
 */

import type { SoilData } from '../types/environmental'
import { lookupRegionalSoil } from '../data/regionalSoilFallback'

export type SoilProvenance = 'live' | 'regional-fallback' | 'user-provided' | 'none'

export interface EffectiveSoil {
  textureClass: string | null
  clayPctApprox: number | null
  provenance: SoilProvenance
  sourceLabel: string
  matchNote: string | null
}

const SOURCE_LABELS: Record<Exclude<SoilProvenance, 'none'>, string> = {
  live: 'Live SoilGrids data',
  'regional-fallback': 'Regional fallback estimate',
  'user-provided': 'User-provided',
}

export function resolveEffectiveSoil(params: {
  stateName: string | null
  cityName: string | null
  overrideTextureClass: string | null
  liveSoil: SoilData | null
}): EffectiveSoil {
  const { stateName, cityName, overrideTextureClass, liveSoil } = params
  const override = overrideTextureClass?.trim() ?? ''

  if (override) {
    return {
      textureClass: override,
      clayPctApprox: liveSoil?.clayPct ?? null,
      provenance: 'user-provided',
      sourceLabel: SOURCE_LABELS['user-provided'],
      matchNote: null,
    }
  }

  if (liveSoil && liveSoil.textureClass !== null) {
    return {
      textureClass: liveSoil.textureClass,
      clayPctApprox: liveSoil.clayPct,
      provenance: 'live',
      sourceLabel: SOURCE_LABELS.live,
      matchNote: null,
    }
  }

  if (liveSoil && liveSoil.clayPct !== null) {
    // Partial live data: percentages without a classified texture.
    return {
      textureClass: null,
      clayPctApprox: liveSoil.clayPct,
      provenance: 'live',
      sourceLabel: SOURCE_LABELS.live,
      matchNote: null,
    }
  }

  if (stateName?.trim() || cityName?.trim()) {
    const match = lookupRegionalSoil(stateName, cityName)
    if (match) {
      const scope =
        match.matchedLevel === 'city'
          ? `Matched city entry: ${match.entry.city}`
          : match.matchedLevel === 'state'
            ? `Matched state entry: ${match.entry.state}`
            : 'All-India composite default'
      return {
        textureClass: match.entry.textureClass,
        clayPctApprox: match.entry.clayPctApprox,
        provenance: 'regional-fallback',
        sourceLabel: SOURCE_LABELS['regional-fallback'],
        matchNote: `${scope} — ${match.entry.sourceNote}`,
      }
    }
  }

  return {
    textureClass: null,
    clayPctApprox: null,
    provenance: 'none',
    sourceLabel: 'Soil data unavailable',
    matchNote: null,
  }
}
