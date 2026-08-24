import { area } from '@turf/area'
import type { GeoPoint } from '../types/assessment'

export const MIN_POLYGON_POINTS = 3

function toRing(points: GeoPoint[]): [number, number][] {
  return points.map((point) => [point.lng, point.lat])
}

/**
 * Geodesic area of a polygon in square metres (Turf.js, WGS84).
 * Returns null for degenerate polygons (< 3 points).
 */
export function calculatePolygonAreaSqm(points: GeoPoint[]): number | null {
  if (points.length < MIN_POLYGON_POINTS) return null
  const ring = toRing(points)
  ring.push([points[0].lng, points[0].lat])
  try {
    const value = area({ type: 'Polygon', coordinates: [ring] })
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function roundAreaToWholeSqm(areaSqm: number): number {
  return Math.round(areaSqm)
}

export function formatAreaSqm(areaSqm: number): string {
  return `${areaSqm.toLocaleString('en-IN')} m²`
}

/**
 * AI roof-image analysis — NOT CONFIGURED in this build.
 *
 * There is no computer-vision model or API wired up yet. This service
 * deliberately reports that honestly instead of returning fake detections.
 * When a real model/API is added later, only this file should change.
 */
export interface RoofAnalysisAvailability {
  available: boolean
  reason: string
}

export interface RoofImageAnalysisResult {
  detectedAreaSqm: number
  confidencePct: number
}

export function getRoofAnalysisAvailability(): RoofAnalysisAvailability {
  return {
    available: false,
    reason:
      'AI roof detection is not configured in this build. Photos are accepted for reference only — enter the area manually or trace it on the satellite map.',
  }
}

export async function analyzeRoofImage(
  _file: File,
): Promise<RoofImageAnalysisResult> {
  throw new Error('AI roof analysis is not configured in this build.')
}
