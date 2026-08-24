import { ApiError, requestJson, toFiniteNumber } from './http'
import type { AirQualityData } from '../types/environmental'

const AQ_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality'

interface AirQualityResponse {
  current?: {
    time?: unknown
    us_aqi?: unknown
    pm2_5?: unknown
    pm10?: unknown
  }
}

export function aqiCategory(usAqi: number): string {
  if (usAqi <= 50) return 'Good'
  if (usAqi <= 100) return 'Moderate'
  if (usAqi <= 150) return 'Unhealthy for sensitive groups'
  if (usAqi <= 200) return 'Unhealthy'
  if (usAqi <= 300) return 'Very unhealthy'
  return 'Hazardous'
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AirQualityData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'us_aqi,pm2_5,pm10',
    timezone: 'GMT',
  })

  const payload = await requestJson<AirQualityResponse>(
    `${AQ_ENDPOINT}?${params.toString()}`,
    { timeoutMs: 15000, signal },
  )

  const current = payload.current
  const usAqi = toFiniteNumber(current?.us_aqi)
  const pm25UgM3 = toFiniteNumber(current?.pm2_5)
  const pm10UgM3 = toFiniteNumber(current?.pm10)

  if (usAqi === null && pm25UgM3 === null && pm10UgM3 === null) {
    throw new ApiError(
      'no-data',
      'No air quality readings are available for this location right now.',
    )
  }

  return {
    usAqi,
    pm25UgM3,
    pm10UgM3,
    category: usAqi === null ? null : aqiCategory(usAqi),
    observedAt: typeof current?.time === 'string' ? current.time : null,
  }
}
