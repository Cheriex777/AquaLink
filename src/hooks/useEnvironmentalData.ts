import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/http'
import { fetchRainfallNormals } from '../services/rainfallService'
import { fetchSoilData } from '../services/soilService'
import { fetchAirQuality } from '../services/airQualityService'
import type { AirQualityData, RainfallData, SoilData } from '../types/environmental'

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

export function useEnvironmentalData(
  latitude: number | null,
  longitude: number | null,
) {
  const [rainfall, setRainfall] = useState<AsyncState<RainfallData>>(idle)
  const [soil, setSoil] = useState<AsyncState<SoilData>>(idle)
  const [airQuality, setAirQuality] = useState<AsyncState<AirQualityData>>(idle)

  const generationRef = useRef(0)

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

    const requests: Array<{
      key: EnvironmentalKey
      request: Promise<RainfallData | SoilData | AirQualityData>
    }> = [
      { key: 'rainfall', request: fetchRainfallNormals(lat, lng) },
      { key: 'soil', request: fetchSoilData(lat, lng) },
      { key: 'airQuality', request: fetchAirQuality(lat, lng) },
    ]

    function applySuccess(key: EnvironmentalKey, data: RainfallData | SoilData | AirQualityData) {
      if (generationRef.current !== generation) return
      if (key === 'rainfall') setRainfall({ status: 'success', data: data as RainfallData, error: null })
      else if (key === 'soil') setSoil({ status: 'success', data: data as SoilData, error: null })
      else setAirQuality({ status: 'success', data: data as AirQualityData, error: null })
    }

    for (const { key, request } of requests) {
      request
        .then((data) => applySuccess(key, data))
        .catch((error: unknown) => {
          if (generationRef.current !== generation) return
          const message = describeError(error)
          if (!message) return
          if (key === 'rainfall') setRainfall({ status: 'error', data: null, error: message })
          else if (key === 'soil') setSoil({ status: 'error', data: null, error: message })
          else setAirQuality({ status: 'error', data: null, error: message })
        })
    }

    return () => {
      generationRef.current += 1
    }
  }, [latitude, longitude])

  const reload = useCallback((key: EnvironmentalKey) => {
    if (latitude === null || longitude === null) return
    const generation = ++generationRef.current
    const lat = latitude
    const lng = longitude
    const markLoading = () => {
      if (key === 'rainfall') setRainfall(loading())
      else if (key === 'soil') setSoil(loading())
      else setAirQuality(loading())
    }

    queueMicrotask(markLoading)

    const request =
      key === 'rainfall'
        ? fetchRainfallNormals(lat, lng)
        : key === 'soil'
          ? fetchSoilData(lat, lng)
          : fetchAirQuality(lat, lng)

    request
      .then((data) => {
        if (generationRef.current !== generation) return
        if (key === 'rainfall') setRainfall({ status: 'success', data: data as RainfallData, error: null })
        else if (key === 'soil') setSoil({ status: 'success', data: data as SoilData, error: null })
        else setAirQuality({ status: 'success', data: data as AirQualityData, error: null })
      })
      .catch((error: unknown) => {
        if (generationRef.current !== generation) return
        const message = describeError(error)
        if (!message) return
        if (key === 'rainfall') setRainfall({ status: 'error', data: null, error: message })
        else if (key === 'soil') setSoil({ status: 'error', data: null, error: message })
        else setAirQuality({ status: 'error', data: null, error: message })
      })
  }, [latitude, longitude])

  return { states: { rainfall, soil, airQuality }, reload }
}
