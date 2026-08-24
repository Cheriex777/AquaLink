export type GeolocationFailure =
  | { kind: 'unsupported' }
  | { kind: 'permission-denied' }
  | { kind: 'position-unavailable' }
  | { kind: 'timeout' }
  | { kind: 'invalid-response' }
  | { kind: 'unknown'; message?: string }

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracyM: number
}

export function getCurrentPosition(timeoutMs = 10000): Promise<GeoPosition> {
  return new Promise<GeoPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({ kind: 'unsupported' } satisfies GeolocationFailure)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const valid =
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        if (!valid) {
          reject({
            kind: 'invalid-response',
          } satisfies GeolocationFailure)
          return
        }
        resolve({ latitude, longitude, accuracyM: accuracy })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject({ kind: 'permission-denied' } satisfies GeolocationFailure)
            break
          case error.POSITION_UNAVAILABLE:
            reject({ kind: 'position-unavailable' } satisfies GeolocationFailure)
            break
          case error.TIMEOUT:
            reject({ kind: 'timeout' } satisfies GeolocationFailure)
            break
          default:
            reject({ kind: 'unknown', message: error.message } satisfies GeolocationFailure)
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    )
  })
}
