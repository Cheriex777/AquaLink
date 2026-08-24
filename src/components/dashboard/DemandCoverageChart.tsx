import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface DemandCoverageChartProps {
  coveragePct: number
}

export default function DemandCoverageChart({
  coveragePct,
}: DemandCoverageChartProps) {
  const clamped = Math.min(Math.max(coveragePct, 0), 100)
  const data = [
    { name: 'Covered by harvest', value: clamped, fill: '#0891b2' },
    { name: 'Uncovered demand', value: Math.round((100 - clamped) * 10) / 10, fill: '#e2e8f0' },
  ]

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={96}
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`]} />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-3xl font-semibold tracking-tight text-slate-900">
            {clamped}%
          </span>
          <span className="text-xs text-slate-500">of water demand</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center gap-2 text-slate-600">
          <span className="size-2.5 rounded-full bg-primary-600" aria-hidden="true" />
          Covered by harvest
        </li>
        <li className="flex items-center gap-2 text-slate-600">
          <span className="size-2.5 rounded-full bg-slate-200" aria-hidden="true" />
          Uncovered demand (municipal/other sources)
        </li>
      </ul>
    </div>
  )
}
