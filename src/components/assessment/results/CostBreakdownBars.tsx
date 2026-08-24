import { formatINR, formatNumber } from '../../../utils/format'

interface CostBreakdownBarsProps {
  filterInr: number
  plumbingInr: number
  tankLitres: number
  tankInr: number
  rechargeStructureInr: number | null
  totalInr: number
}

const ROWS: Array<{
  key: 'filter' | 'plumbing' | 'tank' | 'recharge'
  label: string
  color: string
}> = [
  { key: 'filter', label: 'First-flush filter', color: '#67e8f9' },
  { key: 'plumbing', label: 'Plumbing & fittings', color: '#22d3ee' },
  { key: 'tank', label: 'Storage tank', color: '#0891b2' },
  { key: 'recharge', label: 'Recharge structure', color: '#155e75' },
]

export default function CostBreakdownBars({
  filterInr,
  plumbingInr,
  tankLitres,
  tankInr,
  rechargeStructureInr,
  totalInr,
}: CostBreakdownBarsProps) {
  const values: Record<string, { amount: number; caption?: string }> = {
    filter: { amount: filterInr },
    plumbing: { amount: plumbingInr },
    tank: { amount: tankInr, caption: `${formatNumber(tankLitres)} L` },
    recharge: {
      amount: rechargeStructureInr ?? 0,
      caption: rechargeStructureInr === null ? 'not included' : undefined,
    },
  }

  return (
    <div className="space-y-3">
      {ROWS.map((row) => {
        const entry = values[row.key]
        const pct = totalInr > 0 ? Math.max((entry.amount / totalInr) * 100, 1.5) : 0
        return (
          <div key={row.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">
                {row.label}
                {entry.caption ? (
                  <span className="ml-1 font-normal text-slate-400">({entry.caption})</span>
                ) : null}
              </span>
              <span className="font-semibold text-slate-900">{formatINR(entry.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: row.color }}
                role="presentation"
              />
            </div>
          </div>
        )
      })}
      <div className="flex items-baseline justify-between border-t border-slate-200 pt-2.5 text-sm">
        <span className="font-medium text-slate-700">Total</span>
        <span className="font-bold text-slate-900">{formatINR(totalInr)}</span>
      </div>
    </div>
  )
}
