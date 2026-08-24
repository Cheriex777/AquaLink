import { requireSupabase } from './supabaseClient'
import { ENGINE_VERSION } from './calculationService'
import type {
  AssessmentListItem,
  AssessmentRow,
  EnvironmentalDataRow,
  RecommendationRow,
} from '../types/database'
import type { CalculationResult } from './calculationService'
import type { RecommendationResult } from './recommendationService'
import type { AirQualityData, RainfallData, SoilData } from '../types/environmental'
import type { AssessmentDraft } from '../types/assessment'

export interface EnvironmentalSnapshots {
  rainfall?: RainfallData | null
  soil?: SoilData | null
  airQuality?: AirQualityData | null
}

export interface SaveAssessmentPayload {
  draft: AssessmentDraft
  result: CalculationResult
  recommendation: RecommendationResult | null
  environment: EnvironmentalSnapshots
}

function numOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toRow(draft: AssessmentDraft): Partial<AssessmentRow> {
  return {
    status: 'completed',
    property_name: draft.propertyName.trim(),
    city: draft.city.trim() || null,
    state: draft.state.trim() || null,
    pincode: draft.pincode.trim() || null,
    latitude: numOrNull(draft.latitude),
    longitude: numOrNull(draft.longitude),
    roof_area_sqm: numOrNull(draft.roofAreaSqm) as number,
    roof_material: draft.roofMaterial as string,
    roof_type: draft.roofType || null,
    open_space_sqm: numOrNull(draft.openSpaceSqm),
    roof_polygon:
      draft.roofPolygon.length > 0
        ? draft.roofPolygon.map((point) => ({ lat: point.lat, lng: point.lng }))
        : null,
    roof_area_source: draft.roofAreaSource,
    household_size: numOrNull(draft.householdSize),
    per_capita_lpd: numOrNull(draft.perCapitaLpd),
    annual_rainfall_mm: numOrNull(draft.annualRainfallMm),
  }
}

function describeDbError(error: unknown, action: string): Error {
  const message =
    error instanceof Error ? error.message : 'Unknown database error.'
  return new Error(`${action} failed: ${message}`)
}

/**
 * Persists a full assessment bundle. When `existingId` is provided the
 * assessment row is updated in place (children replaced); otherwise a new
 * row is created. Returns the database id.
 */
export async function saveAssessment(
  payload: SaveAssessmentPayload,
  existingId?: string | null,
): Promise<{ id: string }> {
  const client = requireSupabase()
  const { draft, result, recommendation, environment } = payload

  const row = toRow(draft)
  let assessmentId = existingId ?? null

  if (assessmentId) {
    const { error } = await client
      .from('assessments')
      .update(row)
      .eq('id', assessmentId)
      .select('id')
      .single()
    if (error) throw describeDbError(error, 'Updating assessment')
  } else {
    const { data, error } = await client
      .from('assessments')
      .insert(row)
      .select('id')
      .single()
    if (error) throw describeDbError(error, 'Saving assessment')
    assessmentId = (data as { id: string }).id
  }

  const engineResultUpsert = await client.from('assessment_results').upsert({
    assessment_id: assessmentId,
    result: result,
    engine_version: ENGINE_VERSION,
  })
  if (engineResultUpsert.error) {
    throw describeDbError(engineResultUpsert.error, 'Saving results')
  }

  if (recommendation) {
    const recUpsert = await client.from('recommendations').upsert({
      assessment_id: assessmentId,
      primary_structure: recommendation.primary.structure,
      payload: recommendation,
    })
    if (recUpsert.error) {
      throw describeDbError(recUpsert.error, 'Saving recommendations')
    }
  }

  const clearEnv = await client
    .from('environmental_data')
    .delete()
    .eq('assessment_id', assessmentId)
  if (clearEnv.error) {
    throw describeDbError(clearEnv.error, 'Refreshing environmental data')
  }

  const envRows: Array<{
    assessment_id: string
    source: EnvironmentalDataRow['source']
    payload: RainfallData | SoilData | AirQualityData
  }> = []
  if (environment.rainfall) {
    envRows.push({ assessment_id: assessmentId, source: 'rainfall', payload: environment.rainfall })
  }
  if (environment.soil) {
    envRows.push({ assessment_id: assessmentId, source: 'soil', payload: environment.soil })
  }
  if (environment.airQuality) {
    envRows.push({
      assessment_id: assessmentId,
      source: 'air_quality',
      payload: environment.airQuality,
    })
  }
  if (envRows.length > 0) {
    const envInsert = await client.from('environmental_data').insert(envRows)
    if (envInsert.error) {
      throw describeDbError(envInsert.error, 'Saving environmental data')
    }
  }

  return { id: assessmentId }
}

interface ListRowShape {
  id: string
  property_name: string
  city: string | null
  state: string | null
  created_at: string
  roof_area_sqm: number
  assessment_results: Array<{ result: CalculationResult }> | null
}

export async function listAssessments(): Promise<AssessmentListItem[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('assessments')
    .select(
      'id, property_name, city, state, created_at, roof_area_sqm, assessment_results(result)',
    )
    .order('created_at', { ascending: false })

  if (error) throw describeDbError(error, 'Loading assessments')

  const rows = (data ?? []) as unknown as ListRowShape[]
  return rows.map((row) => ({
    id: row.id,
    propertyName: row.property_name,
    location: [row.city, row.state].filter(Boolean).join(', ') || '—',
    createdAt: row.created_at,
    roofAreaSqm: Number(row.roof_area_sqm),
    harvestKl: row.assessment_results?.[0]?.result?.harvest?.annualKl ?? null,
  }))
}

export async function deleteAssessment(id: string): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('assessments').delete().eq('id', id)
  if (error) throw describeDbError(error, 'Deleting assessment')
}

export interface AssessmentBundle {
  assessment: AssessmentRow
  result: CalculationResult | null
  recommendation: RecommendationRow['payload'] | null
  environmental: EnvironmentalDataRow[]
}

export async function getAssessmentBundle(id: string): Promise<AssessmentBundle> {
  const client = requireSupabase()

  const assessmentQuery = await client
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()
  if (assessmentQuery.error) throw describeDbError(assessmentQuery.error, 'Loading assessment')

  const resultQuery = await client
    .from('assessment_results')
    .select('*')
    .eq('assessment_id', id)
    .maybeSingle()

  const recommendationQuery = await client
    .from('recommendations')
    .select('*')
    .eq('assessment_id', id)
    .maybeSingle()

  const environmentalQuery = await client
    .from('environmental_data')
    .select('*')
    .eq('assessment_id', id)

  return {
    assessment: assessmentQuery.data as AssessmentRow,
    result:
      (resultQuery.data as { result: CalculationResult } | null)?.result ?? null,
    recommendation:
      (recommendationQuery.data as { payload: RecommendationResult } | null)?.payload ??
      null,
    environmental: (environmentalQuery.data ?? []) as EnvironmentalDataRow[],
  }
}
