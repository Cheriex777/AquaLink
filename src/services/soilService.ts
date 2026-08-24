import { ApiError, requestJson, toFiniteNumber } from './http'
import type { SoilData } from '../types/environmental'

const SOILGRIDS_ENDPOINT = 'https://rest.isric.org/soilgrids/v2.0/properties/query'
const DEPTH_LABEL = '0-5cm'

interface SoilGridsResponse {
  properties?: {
    layers?: Array<{
      name?: unknown
      unit_measure?: {
        d_factor?: unknown
      }
      depths?: Array<{
        label?: unknown
        values?: {
          mean?: unknown
        }
      }>
    }>
  }
}

export function classifyUsdaTexture(sand: number, silt: number, clay: number): string {
  if (clay >= 40) {
    if (sand > 45) return 'Sandy clay'
    if (silt >= 40) return 'Silty clay'
    return 'Clay'
  }
  if (clay >= 27) {
    if (sand > 45) return 'Sandy clay loam'
    if (sand < 20) return 'Silty clay loam'
    if (silt < 28) return 'Clay loam'
    return 'Clay loam'
  }
  if (silt >= 80) return 'Silt'
  if (silt >= 50) return 'Silt loam'
  if (sand >= 85) return 'Sand'
  if (sand >= 70) return 'Loamy sand'
  if (clay < 7) return sand >= 52 ? 'Sandy loam' : 'Silt loam'
  if (sand <= 52 && silt >= 28) return 'Loam'
  return 'Sandy loam'
}

function extractMeanPercent(
  payload: SoilGridsResponse,
  layerName: string,
): number | null {
  const layer = payload.properties?.layers?.find((entry) => entry.name === layerName)
  if (!layer) return null
  const depth = layer.depths?.find((entry) => entry.label === DEPTH_LABEL)
  const raw = toFiniteNumber(depth?.values?.mean)
  if (raw === null || raw <= -9999) return null
  const dFactor = toFiniteNumber(layer.unit_measure?.d_factor) ?? 10
  if (dFactor === 0) return null
  return Math.round((raw / dFactor) * 10) / 10
}

export async function fetchSoilData(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<SoilData> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) })
  for (const property of ['sand', 'silt', 'clay', 'phh2o']) {
    params.append('property', property)
  }
  params.append('depth', DEPTH_LABEL)
  params.append('value', 'mean')

  const payload = await requestJson<SoilGridsResponse>(
    `${SOILGRIDS_ENDPOINT}?${params.toString()}`,
    { timeoutMs: 25000, signal },
  )

  const sandPct = extractMeanPercent(payload, 'sand')
  const siltPct = extractMeanPercent(payload, 'silt')
  const clayPct = extractMeanPercent(payload, 'clay')
  const phH2oRaw = extractMeanPercent(payload, 'phh2o')
  const phH2o = phH2oRaw === null ? null : Math.round(phH2oRaw * 10) / 10

  if (sandPct === null && siltPct === null && clayPct === null && phH2o === null) {
    throw new ApiError(
      'no-data',
      'No SoilGrids values exist for this location — soil data is unavailable here.',
    )
  }

  const textureClass =
    sandPct !== null && siltPct !== null && clayPct !== null
      ? classifyUsdaTexture(sandPct, siltPct, clayPct)
      : null

  return {
    sandPct,
    siltPct,
    clayPct,
    phH2o,
    textureClass,
    depthLabel: DEPTH_LABEL,
    provider: 'soilgrids-rest',
    sourceLabel: 'Live SoilGrids data',
  }
}
