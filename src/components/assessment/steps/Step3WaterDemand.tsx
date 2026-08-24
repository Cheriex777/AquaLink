import { Users } from 'lucide-react'
import { NumberField } from '../fields'
import type { StepProps } from './stepProps'

export default function Step3WaterDemand({ draft, errors, onChange }: StepProps) {
  const size = Number(draft.householdSize.trim())
  const lpd = Number(draft.perCapitaLpd.trim())
  const annualDemandKl =
    Number.isFinite(size) && Number.isFinite(lpd) && size > 0 && lpd > 0
      ? Math.round(((size * lpd * 365) / 1000) * 10) / 10
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
        <Users className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-800">Water demand</p>
          <p className="mt-0.5 text-xs">
            Estimated household water use, used to compute demand coverage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          id="householdSize"
          label="Number of residents"
          required
          value={draft.householdSize}
          onChange={(value) => onChange({ householdSize: value })}
          error={errors.householdSize}
          min={1}
        />
        <NumberField
          id="perCapitaLpd"
          label="Per-capita water use"
          required
          value={draft.perCapitaLpd}
          onChange={(value) => onChange({ perCapitaLpd: value })}
          error={errors.perCapitaLpd}
          hint="Litres per person per day · BIS norm ≈ 135"
        />
      </div>

      {annualDemandKl !== null ? (
        <p className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          Estimated annual water demand:{' '}
          <span className="font-semibold">{annualDemandKl.toLocaleString('en-IN')} kL/year</span>{' '}
          <span className="text-xs text-primary-700">(residents × L/person/day × 365)</span>
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700" role="status">
          Enter valid values above to see the estimated annual demand.
        </p>
      )}
    </div>
  )
}
