export type RoofMaterial = 'rcc' | 'metal_sheet' | 'clay_tile' | 'thatch' | 'other'

export type RoofType = 'flat' | 'sloped'

export type RoofAreaSource = 'manual' | 'satellite-measured'

export interface GeoPoint {
  lat: number
  lng: number
}

export function isGeoPoint(value: unknown): value is GeoPoint {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.lat === 'number' &&
    Number.isFinite(record.lat) &&
    typeof record.lng === 'number' &&
    Number.isFinite(record.lng)
  )
}

export interface AssessmentDraft {
  /** Database id once saved to the user's Supabase account; null when local-only. */
  id: string | null
  propertyName: string
  city: string
  state: string
  pincode: string
  latitude: string
  longitude: string
  roofAreaSqm: string
  roofMaterial: RoofMaterial | ''
  roofType: RoofType | ''
  openSpaceSqm: string
  householdSize: string
  perCapitaLpd: string
  annualRainfallMm: string
  soilTextureOverride: string
  roofPolygon: GeoPoint[]
  roofAreaSource: RoofAreaSource
}

export const EMPTY_DRAFT: AssessmentDraft = {
  id: null,
  propertyName: '',
  city: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  roofAreaSqm: '',
  roofMaterial: '',
  roofType: '',
  openSpaceSqm: '',
  householdSize: '4',
  perCapitaLpd: '135',
  annualRainfallMm: '',
  soilTextureOverride: '',
  roofPolygon: [],
  roofAreaSource: 'manual',
}

export function isDraftEmpty(draft: AssessmentDraft): boolean {
  return (
    !draft.propertyName.trim() &&
    !draft.city.trim() &&
    !draft.state.trim() &&
    !draft.roofAreaSqm.trim()
  )
}
