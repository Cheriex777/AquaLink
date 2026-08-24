import { useEffect, useRef, useState } from 'react'
import type { GeoPoint } from '../../types/assessment'

const TILE_SIZE = 256
const MAX_WIDTH = 760

type MapLayer = 'satellite' | 'streets'

const LAYER_URLS: Record<MapLayer, (z: number, x: number, y: number) => string> = {
  satellite: (z, x, y) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  streets: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
}

function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom
  const clampedLat = Math.max(-85.05, Math.min(85.05, lat))
  const latRad = (clampedLat * Math.PI) / 180
  const x = ((lng + 180) / 360) * n
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  return { x: x * TILE_SIZE, y: y * TILE_SIZE }
}

interface StaticMapImageProps {
  latitude: number
  longitude: number
  polygon?: GeoPoint[] | null
  layer?: MapLayer
  zoom?: number
}

export default function StaticMapImage({
  latitude,
  longitude,
  polygon,
  layer = 'satellite',
  zoom = 18,
}: StaticMapImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [activeLayer, setActiveLayer] = useState<MapLayer>(layer)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(Math.min(Math.round(entry.contentRect.width), MAX_WIDTH))
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveLayer(layer), 0)
    return () => window.clearTimeout(timer)
  }, [layer])

  const height = Math.round((width * 9) / 16)
  const centerPx = project(latitude, longitude, zoom)
  const startWorldX = centerPx.x - width / 2
  const startWorldY = centerPx.y - height / 2

  const n = 2 ** zoom
  const tileXStart = Math.floor(startWorldX / TILE_SIZE)
  const tileYStart = Math.floor(startWorldY / TILE_SIZE)
  const tilesAcross = Math.ceil(width / TILE_SIZE) + 1
  const tilesDown = Math.ceil(height / TILE_SIZE) + 1

  const tiles: Array<{ key: string; src: string; left: number; top: number }> = []
  for (let dx = 0; dx < tilesAcross; dx += 1) {
    for (let dy = 0; dy < tilesDown; dy += 1) {
      const tx = tileXStart + dx
      const ty = tileYStart + dy
      if (ty < 0 || ty >= n) continue
      const wrappedX = ((tx % n) + n) % n
      tiles.push({
        key: `${tx}-${ty}`,
        src: LAYER_URLS[activeLayer](zoom, wrappedX, ty),
        left: tx * TILE_SIZE - startWorldX,
        top: ty * TILE_SIZE - startWorldY,
      })
    }
  }

  function toScreen(point: GeoPoint): { x: number; y: number } {
    const world = project(point.lat, point.lng, zoom)
    return { x: world.x - startWorldX, y: world.y - startWorldY }
  }

  const polygonPointsSvg = polygon && polygon.length >= 3
    ? polygon.map(toScreen).map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')
    : null

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-lg border border-slate-300"
        style={{ width: '100%', height }}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            loading="eager"
            onError={() => {
              if (activeLayer === 'satellite') setActiveLayer('streets')
            }}
            className="pointer-events-none absolute select-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        {polygonPointsSvg ? (
          <>
            <svg className="absolute inset-0" width={width} height={height} aria-hidden="true">
              <polygon
                points={polygonPointsSvg}
                fill="rgba(34, 211, 238, 0.25)"
                stroke="#0891b2"
                strokeWidth={2}
              />
              {polygon!.map((point, index) => {
                const screen = toScreen(point)
                return (
                  <circle
                    key={index}
                    cx={screen.x}
                    cy={screen.y}
                    r={3.5}
                    fill="#0891b2"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )
              })}
            </svg>
          </>
        ) : null}

        <div
          className="absolute"
          style={{
            left: width / 2 - 11,
            top: height / 2 - 22,
          }}
          aria-hidden="true"
        >
          <svg width="22" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="#0891b2"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
          </svg>
        </div>

        <span className="absolute bottom-1 right-1.5 rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-slate-600">
          {activeLayer === 'satellite'
            ? 'Imagery © Esri, Maxar, Earthstar Geographics'
            : '© OpenStreetMap contributors'}
        </span>
      </div>
    </div>
  )
}
