import { ApiError, requestJson } from './http'
import { MONTH_NAMES, type MonthlyRainfallNormal, type RainfallData } from '../types/environmental'

const ARCHIVE_ENDPOINT = 'https://archive-api.open-meteo.com/v1/archive'
const YEARS_BACK = 10
const MIN_YEARS_REQUIRED = 5

interface ArchiveResponse {
  daily?: {
    time?: unknown
    precipitation_sum?: unknown
  }
}

interface YearMonthAccumulator {
  totalsByYear: Map<number, number[]>
}

function parseIsoDateParts(iso: string): { year: number; monthIndex: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const year = Number(iso.slice(0, 4))
  const monthIndex = Number(iso.slice(5, 7)) - 1
  if (monthIndex < 0 || monthIndex > 11) return null
  return { year, monthIndex }
}

function aggregateNormals(
  times: string[],
  precipitation: unknown[],
): { monthlyNormalsMm: MonthlyRainfallNormal[]; annualTotalMm: number; yearsUsed: number } {
  const accumulator: YearMonthAccumulator = { totalsByYear: new Map() }

  for (let i = 0; i < times.length; i += 1) {
    const parts = parseIsoDateParts(times[i])
    if (!parts) continue
    const value = precipitation[i]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue

    let months = accumulator.totalsByYear.get(parts.year)
    if (!months) {
      months = new Array<number>(12).fill(0)
      accumulator.totalsByYear.set(parts.year, months)
    }
    months[parts.monthIndex] += value
  }

  const yearsUsed = [...accumulator.totalsByYear.keys()].filter((year) => {
    const recordedMonths = accumulator.totalsByYear.get(year)
    if (!recordedMonths) return false
    return year >= Number(times[0].slice(0, 4)) && year <= Number(times[times.length - 1].slice(0, 4))
  }).length

  if (yearsUsed < MIN_YEARS_REQUIRED) {
    throw new ApiError(
      'no-data',
      `Only ${yearsUsed} usable years of rainfall records were returned — not enough for a reliable normal.`,
    )
  }

  const monthlyNormalsMm: MonthlyRainfallNormal[] = MONTH_NAMES.map((month, monthIndex) => {
    let total = 0
    let count = 0
    for (const months of accumulator.totalsByYear.values()) {
      total += months[monthIndex]
      count += 1
    }
    const average = count > 0 ? total / count : 0
    return { month, totalMm: Math.round(average * 10) / 10 }
  })

  const annualTotalMm =
    Math.round(monthlyNormalsMm.reduce((sum, entry) => sum + entry.totalMm, 0) * 10) / 10

  return { monthlyNormalsMm, annualTotalMm, yearsUsed }
}

export async function fetchRainfallNormals(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<RainfallData> {
  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - YEARS_BACK + 1

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'precipitation_sum',
    timezone: 'GMT',
  })

  const payload = await requestJson<ArchiveResponse>(
    `${ARCHIVE_ENDPOINT}?${params.toString()}`,
    { timeoutMs: 25000, signal },
  )

  const times = payload.daily?.time
  const precipitation = payload.daily?.precipitation_sum

  if (
    !Array.isArray(times) ||
    !Array.isArray(precipitation) ||
    times.length === 0 ||
    times.length !== precipitation.length ||
    typeof times[0] !== 'string' ||
    typeof times[times.length - 1] !== 'string'
  ) {
    throw new ApiError('no-data', 'Rainfall service returned no usable records.')
  }

  const { monthlyNormalsMm, annualTotalMm, yearsUsed } = aggregateNormals(
    times as string[],
    precipitation,
  )

  return {
    annualTotalMm,
    monthlyNormalsMm,
    yearsUsed,
    periodStartYear: startYear,
    periodEndYear: endYear,
  }
}
