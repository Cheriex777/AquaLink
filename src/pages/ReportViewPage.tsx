import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  FileDown,
  Printer,
  RotateCw,
} from 'lucide-react'
import ReportDocument from '../components/reports/ReportDocument'
import Skeleton from '../components/common/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../services/supabaseClient'
import {
  getAssessmentBundle,
  type AssessmentBundle,
} from '../services/assessmentStore'

export default function ReportViewPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [bundle, setBundle] = useState<AssessmentBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setBundle(await getAssessmentBundle(id))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load this report.',
      )
      setBundle(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!isSupabaseConfigured || authLoading || !user) {
      const resetTimer = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(resetTimer)
    }
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [user, authLoading, load])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          My Reports
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!bundle}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Printer className="size-4" aria-hidden="true" />
            Print
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!bundle}
            title="Opens the print dialog — choose “Save as PDF” as the destination"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-40"
          >
            <FileDown className="size-4" aria-hidden="true" />
            Download PDF
          </button>
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center print:hidden">
          <p className="text-sm text-slate-500">
            Supabase is not configured — reports require a database connection.
          </p>
        </section>
      ) : loading || authLoading ? (
        <div className="space-y-3 rounded-xl bg-white p-8 print:hidden">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className={index % 2 ? 'h-6 w-3/4' : 'h-10 w-full'} />
          ))}
        </div>
      ) : !user ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center print:hidden">
          <p className="text-sm text-slate-500">Sign in to view saved reports.</p>
          <Link
            to="/reports"
            className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline"
          >
            Back to My Reports
          </Link>
        </section>
      ) : error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center print:hidden">
          <AlertTriangle className="mx-auto mb-3 size-7 text-red-500" aria-hidden="true" />
          <p role="alert" className="text-sm font-medium text-red-800">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry
            </button>
            <Link
              to="/reports"
              className="rounded-lg px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Back to list
            </Link>
          </div>
        </section>
      ) : bundle ? (
        <div className="print-area rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0">
          <ReportDocument bundle={bundle} />
        </div>
      ) : null}
    </div>
  )
}
