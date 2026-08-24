import { useRef, useState } from 'react'
import {
  BadgeCheck,
  Camera,
  Home,
  Info,
  PencilRuler,
  X,
} from 'lucide-react'
import { NumberField, RadioGroupField, SelectField } from '../fields'
import RooftopMeasureModal from '../RooftopMeasureModal'
import {
  ROOF_MATERIAL_OPTIONS,
  getRoofMaterial,
} from '../../../services/calculationService'
import { getRoofAnalysisAvailability } from '../../../services/roofAnalysisService'
import type { RoofMaterial, RoofType } from '../../../types/assessment'
import { isValidLatitude, isValidLongitude, parseCoordinate } from '../../../utils/geo'
import type { StepProps } from './stepProps'

const DEFAULT_CENTER: [number, number] = [21.1458, 79.0882]

export default function Step2Rooftop({ draft, errors, onChange }: StepProps) {
  const selected = getRoofMaterial(draft.roofMaterial)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [photoName, setPhotoName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const availability = getRoofAnalysisAvailability()

  const latitude = parseCoordinate(draft.latitude, isValidLatitude)
  const longitude = parseCoordinate(draft.longitude, isValidLongitude)
  const propertyMarker =
    latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null

  const isMeasured = draft.roofAreaSource === 'satellite-measured'

  function handleManualAreaChange(value: string) {
    if (isMeasured) {
      onChange({ roofAreaSqm: value, roofPolygon: [], roofAreaSource: 'manual' })
      return
    }
    onChange({ roofAreaSqm: value })
  }

  function handleMeasuredConfirm(areaSqm: number, points: typeof draft.roofPolygon) {
    onChange({
      roofAreaSqm: String(areaSqm),
      roofPolygon: points,
      roofAreaSource: 'satellite-measured',
    })
    setMeasureOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
        <Home className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-800">Rooftop details</p>
          <p className="mt-0.5 text-xs">
            Enter the area manually, trace the roof on satellite imagery for a
            real-world measurement, or both — tracing never blocks manual entry.
          </p>
        </div>
      </div>

      {isMeasured ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
          <p className="flex items-start gap-2 text-xs text-primary-800">
            <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Using your traced rooftop measurement ({draft.roofAreaSqm} m² ·{' '}
            {draft.roofPolygon.length} boundary points). Editing the field below
            switches back to manual entry.
          </p>
          <button
            type="button"
            onClick={() =>
              onChange({ roofPolygon: [], roofAreaSource: 'manual' })
            }
            className="shrink-0 rounded-md p-1 text-primary-500 hover:bg-primary-100"
            aria-label="Discard traced measurement"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          id="roofArea"
          label="Roof area"
          required
          value={draft.roofAreaSqm}
          onChange={handleManualAreaChange}
          error={errors.roofAreaSqm}
          hint={isMeasured ? 'Traced value — editable' : 'Total catchment area in m²'}
          placeholder="e.g. 140"
        />
        <NumberField
          id="openSpace"
          label="Open space around building"
          value={draft.openSpaceSqm}
          onChange={(value) => onChange({ openSpaceSqm: value })}
          error={errors.openSpaceSqm}
          hint="Optional, m² — used later for recharge planning"
          placeholder="e.g. 200"
        />
      </div>

      <button
        type="button"
        onClick={() => setMeasureOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-600 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50 sm:w-auto"
      >
        <PencilRuler className="size-4" aria-hidden="true" />
        Trace rooftop on satellite imagery
      </button>

      <SelectField
        id="roofMaterial"
        label="Roof material"
        required
        value={draft.roofMaterial}
        onChange={(value) => onChange({ roofMaterial: value as RoofMaterial })}
        error={errors.roofMaterial}
        options={ROOF_MATERIAL_OPTIONS.map(({ value, label }) => ({ value, label }))}
        placeholderOption="Select material"
      />

      <RadioGroupField
        legend="Roof type"
        name="roofType"
        required
        value={draft.roofType}
        onChange={(value) => onChange({ roofType: value as RoofType })}
        error={errors.roofType}
        options={[
          { value: 'flat', label: 'Flat', description: 'Water drains via outlets' },
          { value: 'sloped', label: 'Sloped', description: 'Water drains to gutters' },
        ]}
      />

      {selected ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Runoff coefficient assumed for this material:{' '}
          <span className="font-semibold text-slate-700">
            {selected.runoffCoefficient}
          </span>{' '}
          — used in the preliminary estimate.
        </p>
      ) : null}

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Camera className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Analyze Property (AI roof detection)
              </p>
              <p className="mt-0.5 max-w-md text-xs text-slate-500">
                {availability.reason}
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            id="roof-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setPhotoName(file.name)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            {photoName ? 'Replace photo' : 'Attach rooftop photo'}
          </button>
        </div>
        {photoName ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-600">
              <Info className="size-3 shrink-0 text-slate-400" aria-hidden="true" />
              {photoName} — attached for reference only; no analysis will run.
            </p>
            <button
              type="button"
              onClick={() => {
                setPhotoName(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200"
              aria-label="Remove attached photo"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>

      {measureOpen ? (
        <RooftopMeasureModal
          initialPolygon={draft.roofPolygon}
          center={
            propertyMarker
              ? [propertyMarker.lat, propertyMarker.lng]
              : DEFAULT_CENTER
          }
          propertyMarker={propertyMarker}
          onClose={() => setMeasureOpen(false)}
          onConfirm={handleMeasuredConfirm}
        />
      ) : null}
    </div>
  )
}
