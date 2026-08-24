import { requestJson } from './http'

export interface ReverseGeocodeResult {
  displayName: string
}

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '0',
    'accept-language': 'en',
  })
  const data = await requestJson<{ display_name?: unknown }>(
    `${NOMINATIM_ENDPOINT}?${params.toString()}`,
    { timeoutMs: 12000, signal },
  )
  if (typeof data.display_name !== 'string' || data.display_name.trim() === '') {
    throw new Error('No address found for these coordinates')
  }
  return { displayName: data.display_name }
}
