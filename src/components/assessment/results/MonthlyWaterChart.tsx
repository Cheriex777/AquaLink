import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MONTH_NAMES } from '../../../types/environmental'

interface MonthlyWaterChartProps {
  monthlyHarvestKl: number[] | null
  monthlyDemandKl: number
}

export default function MonthlyWaterChart({
  monthlyHarvestKl,
  monthlyDemandKl,
}: MonthlyWaterChartProps) {
  if (monthlyHarvestKl === null) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <p className="text-xs text-slate-400">
          Monthly pattern needs rainfall normals — reload environmental data in
          Step 4 to enable this chart.
        </p>
      </div>
    )
  }

  const data = MONTH_NAMES.map((month, index) => ({
    month,
    harvestKl: Math.round((monthlyHarvestKl[index] / 1000) * 100) / 100,
    demandKl: Math.round(monthlyDemandKl * 100) / 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 11, fill: '#64748b' }}
          label={{ value: 'kL', position: 'insideTopLeft', offset: 8, fontSize: 11, fill: '#94a3b8' }}
        />
        <Tooltip formatter={(value) => [`${value} kL`]} cursor={{ fill: 'rgba(8, 145, 178, 0.08)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="harvestKl" name="Harvest" fill="#0891b2" radius={[3, 3, 0, 0]} />
        <Bar dataKey="demandKl" name="Demand" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
