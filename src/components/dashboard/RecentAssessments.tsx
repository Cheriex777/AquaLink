import { Link } from 'react-router-dom'
import { ChevronRight, Inbox, MapPin } from 'lucide-react'
import type { AssessmentListItem } from '../../types/database'
import { formatDate, formatNumber } from '../../utils/format'
import EmptyState from '../common/EmptyState'

interface RecentAssessmentsProps {
  items: AssessmentListItem[]
}

export default function RecentAssessments({ items }: RecentAssessmentsProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No assessments yet"
        description="Run your first rainwater harvesting assessment and save it to see it listed here."
        action={
          <Link
            to="/new-assessment"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Start New Assessment
          </Link>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-5 py-3 font-medium">Property</th>
            <th scope="col" className="px-5 py-3 font-medium">Assessed on</th>
            <th scope="col" className="px-5 py-3 font-medium">Roof area</th>
            <th scope="col" className="px-5 py-3 font-medium">Status</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Harvest potential</th>
            <th scope="col" className="px-5 py-3">
              <span className="sr-only">Open report</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <p className="font-medium text-slate-900">{item.propertyName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="size-3" aria-hidden="true" />
                  {item.location}
                </p>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {formatDate(item.createdAt)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {formatNumber(item.roofAreaSqm)} m²
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Saved
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-900">
                {item.harvestKl !== null ? `${formatNumber(item.harvestKl, 1)} kL/yr` : '—'}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  to={`/reports/${item.id}`}
                  aria-label={`View report for ${item.propertyName}`}
                  className="inline-flex rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
