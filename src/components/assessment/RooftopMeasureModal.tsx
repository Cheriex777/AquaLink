import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Map as MapIcon,
  PencilRuler,
  RotateCcw,
  Satellite,
  Undo2,
  X,
} from 'lucide-react'
import RooftopDrawMap, { type MapLayerKind } from '../location/RooftopDrawMap'
import {
  MIN_POLYGON_POINTS,
  calculatePolygonAreaSqm,
  roundAreaToWholeSqm,
} from '../../services/roofAnalysisService'
import type { GeoPoint } from '../../types/assessment'

interface RooftopMeasureModalProps {
  initialPolygon: GeoPoint[]
  center: [number, number]
  propertyMarker: GeoPoint | null
  onClose: () => void
  onConfirm: (areaSqm: number, points: GeoPoint[]) => void
}

export default function RooftopMeasureModal({
  initialPolygon,
  center,
  propertyMarker,
  onClose,
  onConfirm,
}: RooftopMeasureModalProps) {
  const [points, setPoints] = useState<GeoPoint[]>(initialPolygon)
  const [drawing, setDrawing] = useState(initialPolygon.length === 0)
  const [layer, setLayer] = useState<MapLayerKind>('satellite')
  const [tilesFailed, setTilesFailed] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  function handleLayerChange(next: MapLayerKind) {
    if (next === layer) return
    setLayer(next)
    setTilesFailed(false)
  }

  function addVertex(latitude: number, longitude: number) {
    setPoints((current) => [...current, { lat: latitude, lng: longitude }])
  }

  function moveVertex(index: number, latitude: number, longitude: number) {
    setPoints((current) =>
      current.map((point, i) => (i === index ? { lat: latitude, lng: longitude } : point)),
    )
  }

  function undoLast() {
    setPoints((current) => current.slice(0, -1))
  }

  function clearAll() {
    setPoints([])
    setDrawing(true)
  }

  const areaSqm = useMemo(() => {
    const raw = calculatePolygonAreaSqm(points)
    return raw === null ? null : roundAreaToWholeSqm(raw)
  }, [points])

  const canFinish = drawing && points.length >= MIN_POLYGON_POINTS
  const canConfirm = !drawing && areaSqm !== null && points.length >= MIN_POLYGON_POINTS

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Trace rooftop on satellite imagery"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-2xl sm:m-auto sm:h-full sm:max-h-[92vh] sm:w-full sm:max-w-4xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <PencilRuler className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Trace rooftop</h2>
              <p className="text-xs text-slate-500">
                You trace the boundary — no automatic detection is involved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rooftop tracing"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                drawing ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {drawing ? `Drawing · tap roof corners (${points.length})` : 'Editing — drag points to adjust'}
            </span>
            {!drawing ? (
              <button
                type="button"
                onClick={() => setDrawing(true)}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
              >
                Add more points
              </button>
            ) : null}
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Base map layer">
            <button
              type="button"
              onClick={() => handleLayerChange('streets')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                layer === 'streets' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="size-3.5" aria-hidden="true" />
              Map
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange('satellite')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                layer === 'satellite' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Satellite className="size-3.5" aria-hidden="true" />
              Satellite
            </button>
          </div>
        </div>

        {tilesFailed ? (
          <div className="flex shrink-0 items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Imagery tiles are failing to load — check your connection or switch layers.
              Manual roof-area entry in the form always remains available.
            </span>
          </div>
        ) : null}

        <div className="min-h-[45vh] flex-1 sm:min-h-0">
          <RooftopDrawMap
            center={center}
            layer={layer}
            points={points}
            drawing={drawing}
            propertyMarker={propertyMarker}
            onAddVertex={addVertex}
            onMoveVertex={moveVertex}
            onTileError={() => setTilesFailed(true)}
          />
        </div>

        <footer className="shrink-0 space-y-3 border-t border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Measured roof area
              </p>
              <p className={`text-2xl font-semibold tracking-tight ${areaSqm !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {areaSqm !== null
                  ? `${areaSqm.toLocaleString('en-IN')} m²`
                  : '— m²'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Geodesic area of the drawn polygon (WGS84) · drag any point to refine
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={undoLast}
                disabled={points.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Undo2 className="size-3.5" aria-hidden="true" />
                Undo point
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={points.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Clear &amp; redraw
              </button>
              {drawing ? (
                <button
                  type="button"
                  onClick={() => setDrawing(false)}
                  disabled={!canFinish}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-40"
                >
                  Finish shape
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="hidden text-xs text-slate-400 sm:block">Esc to cancel</p>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (areaSqm !== null && canConfirm) onConfirm(areaSqm, points)
                }}
                disabled={!canConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="size-4" aria-hidden="true" />
                Use this area
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
