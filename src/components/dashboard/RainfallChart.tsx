import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyRainfallPoint } from '../../types/environmental'

interface RainfallChartProps {
  data: MonthlyRainfallPoint[]
}

export default function RainfallChart({ data }: RainfallChartProps) {
  const peakIndex = data.reduce(
    (max, point, index) => (point.rainfallMm > data[max].rainfallMm ? index : max),
    0,
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fontSize: 11, fill: '#64748b' }}
          label={{
            value: 'mm',
            position: 'insideTopLeft',
            offset: 8,
            fontSize: 11,
            fill: '#94a3b8',
          }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(8, 145, 178, 0.08)' }}
          formatter={(value) => [`${value} mm`, 'Rainfall']}
        />
        <Bar dataKey="rainfallMm" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={entry.month}
              fill={index === peakIndex ? '#0e7490' : '#22d3ee'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
