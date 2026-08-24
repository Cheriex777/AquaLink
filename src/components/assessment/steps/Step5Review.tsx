import { AlertCircle, Pencil } from 'lucide-react'
import { getRoofMaterial } from '../../../services/calculationService'
import type { AssessmentDraft } from '../../../types/assessment'
import { formatNumber } from '../../../utils/format'

interface Step5ReviewProps {
  draft: AssessmentDraft
  rainfallError?: string
  onEdit: (stepIndex: number) => void
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function ReviewSection({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string
  stepIndex: number
  onEdit: (stepIndex: number) => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
        >
          <Pencil className="size-3" aria-hidden="true" />
          Edit
        </button>
      </div>
      <dl className="divide-y divide-slate-50 px-5 py-2">{children}</dl>
    </section>
  )
}

export default function Step5Review({ draft, rainfallError, onEdit }: Step5ReviewProps) {
  const material = getRoofMaterial(draft.roofMaterial)
  const fmt = (v: string) => (v.trim() ? v.trim() : '—')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Review assessment</h3>
        <p className="mt-1 text-sm text-slate-500">
          Check the details below. Use Edit to change any section before
          calculating.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReviewSection title="Property & Location" stepIndex={0} onEdit={onEdit}>
          <ReviewRow label="Property name" value={draft.propertyName.trim() || '—'} />
          <ReviewRow label="City / State" value={`${fmt(draft.city)}, ${fmt(draft.state)}`} />
          <ReviewRow label="PIN code" value={draft.pincode.trim() || '—'} />
          <ReviewRow
            label="Coordinates"
            value={
              draft.latitude.trim() && draft.longitude.trim()
                ? `${draft.latitude}, ${draft.longitude}`
                : 'Not provided'
            }
          />
        </ReviewSection>

        <ReviewSection title="Rooftop" stepIndex={1} onEdit={onEdit}>
          <ReviewRow
            label="Roof area"
            value={
              draft.roofAreaSqm.trim()
                ? `${draft.roofAreaSqm} m²${
                    draft.roofAreaSource === 'satellite-measured'
                      ? ' · traced on satellite imagery'
                      : ''
                  }`
                : '—'
            }
          />
          <ReviewRow label="Roof material" value={material?.label ?? '—'} />
          <ReviewRow label="Roof type" value={draft.roofType || '—'} />
          <ReviewRow
            label="Open space"
            value={draft.openSpaceSqm.trim() ? `${draft.openSpaceSqm} m²` : '—'}
          />
        </ReviewSection>

        <ReviewSection title="Water Demand" stepIndex={2} onEdit={onEdit}>
          <ReviewRow label="Residents" value={draft.householdSize || '—'} />
          <ReviewRow
            label="Per-capita use"
            value={
              draft.perCapitaLpd.trim()
                ? `${draft.perCapitaLpd} L/person/day`
                : '—'
            }
          />
          <ReviewRow
            label="Annual rainfall"
            value={
              draft.annualRainfallMm.trim()
                ? `${formatNumber(Number(draft.annualRainfallMm))} mm/year`
                : '—'
            }
          />
        </ReviewSection>
      </div>

      {rainfallError ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {rainfallError}
          </p>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Fix in Step 4
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500">
        <p className="mb-1 font-semibold uppercase tracking-wide text-slate-400">
          Assumptions applied
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>Runoff coefficient: {material ? material.runoffCoefficient : '—'} ({material?.label ?? 'material not set'})</li>
          <li>Collection efficiency: 90% (first-flush & filter losses)</li>
          <li>Rainfall: live Open-Meteo climatological normal, or manual override (Step 4)</li>
          {draft.roofAreaSource === 'satellite-measured' ? (
            <li>Roof area traced by you on satellite imagery ({draft.roofPolygon.length} points) — not AI-detected</li>
          ) : (
            <li>Roof area entered manually</li>
          )}
        </ul>
      </div>
    </div>
  )
}
