import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/http'
import { fetchRainfallNormals } from '../services/rainfallService'
import { fetchSoilData } from '../services/soilService'
import { fetchAirQuality } from '../services/airQualityService'
import type { AirQualityData, RainfallData, SoilData } from '../types/environmental'
import {
  lookupRegionalSoil,
  toRegionalSoilData,
} from '../data/regionalSoilFallback'

export type EnvironmentalKey = 'rainfall' | 'soil' | 'airQuality'

export interface AsyncState<T> {
  status: 'idle' | 'loading' | 'success' | 'error'
  data: T | null
  error: string | null
}

function idle<T>(): AsyncState<T> {
  return { status: 'idle', data: null, error: null }
}

function loading<T>(): AsyncState<T> {
  return { status: 'loading', data: null, error: null }
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof DOMException && error.name === 'AbortError') return ''
  return 'Something went wrong while contacting the service.'
}

export interface SoilLocationNames {
  state: string | null
  city: string | null
}

/**
 * Loads environmental data for a coordinate pair.
 *
 * SOIL FALLBACK: when the live SoilGrids call fails, times out or returns no
 * usable values (null / 503 / timeout / network), the hook resolves the
 * regional fallback dataset and publishes it as the canonical `soil` SUCCESS
 * state (provider = 'regional-fallback'). Consumers therefore never read the
 * failed API result instead of the fallback. Only when NO state/city names
 * are available does soil end in the error state.
 */
export function useEnvironmentalData(
  latitude: number | null,
  longitude: number | null,
  locationNames?: SoilLocationNames,
) {
  const [rainfall, setRainfall] = useState<AsyncState<RainfallData>>(idle)
  const [soil, setSoil] = useState<AsyncState<SoilData>>(idle)
  const [airQuality, setAirQuality] = useState<AsyncState<AirQualityData>>(idle)

  const generationRef = useRef(0)
  const namesRef = useRef<SoilLocationNames | undefined>(locationNames)

  useEffect(() => {
    namesRef.current = locationNames
  }, [locationNames])

  function loadFallbackSoil(generation: number): boolean {
    const names = namesRef.current
    if (!names || (!names.state?.trim() && !names.city?.trim())) return false
    const match = lookupRegionalSoil(names.state, names.city)
    if (!match) return false
    if (generationRef.current !== generation) return true
    setSoil({ status: 'success', data: toRegionalSoilData(match), error: null })
    return true
  }

  function loadSoil(lat: number, lng: number, generation: number) {
    fetchSoilData(lat, lng)
      .then((data) => {
        if (generationRef.current !== generation) return
        setSoil({ status: 'success', data, error: null })
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        // LIVE SOURCE FAILED (null / 503 / timeout / network) → regional fallback.
        if (loadFallbackSoil(generation)) return
        // No location names → genuinely unavailable.
        setSoil({
          status: 'error',
          data: null,
          error:
            error instanceof ApiError && error.kind === 'no-data'
              ? 'No live soil values exist for this location, and no regional fallback is available without a state/city.'
              : describeError(error),
        })
      })
  }

  useEffect(() => {
    if (latitude === null || longitude === null) {
      const timer = window.setTimeout(() => {
        setRainfall(idle())
        setSoil(idle())
        setAirQuality(idle())
      }, 0)
      return () => window.clearTimeout(timer)
    }

    const lat = latitude
    const lng = longitude
    const generation = ++generationRef.current

    queueMicrotask(() => {
      if (generationRef.current !== generation) return
      setRainfall(loading())
      setSoil(loading())
      setAirQuality(loading())
    })

    fetchRainfallNormals(lat, lng)
      .then((data) => {
        if (generationRef.current !== generation) return
        setRainfall({ status: 'success', data, error: null })
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation) return
        const message = describeError(error)
        if (!message) return
        setRainfall({ status: 'error', data: null, error: message })
      })

    loadSoil(lat, lng, generation)

    fetchAirQuality(lat, lng)
      .then((data) => {
        if (generationRef.current !== generation) return
        setAirQuality({ status: 'success', data, error: null })
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation) return
        const message = describeError(error)
        if (!message) return
        setAirQuality({ status: 'error', data: null, error: message })
      })

    return () => {
      generationRef.current += 1
    }
  }, [latitude, longitude])

  const reload = useCallback(
    (key: EnvironmentalKey) => {
      if (latitude === null || longitude === null) return
      const lat = latitude
      const lng = longitude
      const generation = ++generationRef.current

      queueMicrotask(() => {
        if (generationRef.current !== generation) return
        if (key === 'rainfall') setRainfall(loading())
        else if (key === 'soil') setSoil(loading())
        else setAirQuality(loading())
      })

      if (key === 'soil') {
        loadSoil(lat, lng, generation)
        return
      }

      if (key === 'rainfall') {
        fetchRainfallNormals(lat, lng)
          .then((data) => {
            if (generationRef.current !== generation) return
            setRainfall({ status: 'success', data, error: null })
          })
          .catch((error: unknown) => {
            if (generationRef.current !== generation) return
            const message = describeError(error)
            if (!message) return
            setRainfall({ status: 'error', data: null, error: message })
          })
        return
      }

      fetchAirQuality(lat, lng)
        .then((data) => {
          if (generationRef.current !== generation) return
          setAirQuality({ status: 'success', data, error: null })
        })
        .catch((error: unknown) => {
          if (generationRef.current !== generation) return
          const message = describeError(error)
          if (!message) return
          setAirQuality({ status: 'error', data: null, error: message })
        })
    },
    [latitude, longitude],
  )

  return { states: { rainfall, soil, airQuality }, reload }
}
