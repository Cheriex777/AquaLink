export interface MonthlyRainfallNormal {
  month: string
  totalMm: number
}

export interface MonthlyRainfallPoint {
  month: string
  rainfallMm: number
}

export interface RainfallData {
  annualTotalMm: number
  monthlyNormalsMm: MonthlyRainfallNormal[]
  yearsUsed: number
  periodStartYear: number
  periodEndYear: number
}

export type SoilDataProvider =
  | 'soilgrids-rest'
  | 'soilgrids-wms'
  | 'regional-fallback'
  | 'user-provided'

export interface SoilData {
  sandPct: number | null
  siltPct: number | null
  clayPct: number | null
  phH2o: number | null
  textureClass: string | null
  depthLabel: string
  /** Where this estimate came from — drives honest labelling in UI/reports. */
  provider?: SoilDataProvider
  /** Exact UI-facing label, e.g. "Live SoilGrids data". */
  sourceLabel?: string
  /** Optional context, e.g. which regional entry matched. */
  matchNote?: string | null
}

export interface AirQualityData {
  usAqi: number | null
  pm25UgM3: number | null
  pm10UgM3: number | null
  category: string | null
  observedAt: string | null
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

export { MONTH_NAMES }
