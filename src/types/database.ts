import type { CalculationResult } from '../services/calculationService'
import type { RecommendationResult } from '../services/recommendationService'
import type { AirQualityData, RainfallData, SoilData } from './environmental'

export interface AssessmentRow {
  id: string
  user_id: string
  status: 'draft' | 'completed'
  property_name: string
  city: string | null
  state: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  roof_area_sqm: number
  roof_material: string
  roof_type: string | null
  open_space_sqm: number | null
  roof_polygon: Array<{ lat: number; lng: number }> | null
  roof_area_source: 'manual' | 'satellite-measured'
  household_size: number | null
  per_capita_lpd: number | null
  annual_rainfall_mm: number | null
  rainfall_source: 'open-meteo' | 'manual' | null
  created_at: string
  updated_at: string
}

export interface EnvironmentalDataRow {
  id: string
  assessment_id: string
  source: 'rainfall' | 'soil' | 'air_quality'
  payload: RainfallData | SoilData | AirQualityData
  fetched_at: string
}

export interface AssessmentResultRow {
  id: string
  assessment_id: string
  result: CalculationResult
  engine_version: string
  created_at: string
}

export interface RecommendationRow {
  id: string
  assessment_id: string
  primary_structure: string
  payload: RecommendationResult
  created_at: string
}

export interface ReportRow {
  id: string
  assessment_id: string
  user_id: string
  title: string | null
  generated_at: string
}

/** Shape used by the My Reports list view. */
export interface AssessmentListItem {
  id: string
  propertyName: string
  location: string
  createdAt: string
  roofAreaSqm: number
  harvestKl: number | null
}
