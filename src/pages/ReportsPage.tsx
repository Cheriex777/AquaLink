import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CloudUpload,
  FileText,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import Skeleton from '../components/common/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../services/supabaseClient'
import {
  deleteAssessment,
  listAssessments,
} from '../services/assessmentStore'
import type { AssessmentListItem } from '../types/database'
import { formatDate, formatNumber } from '../utils/format'

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<AssessmentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listAssessments())
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Could not load assessments.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured && user) {
      const timer = window.setTimeout(() => void load(), 0)
      return () => window.clearTimeout(timer)
    }
    const resetTimer = window.setTimeout(() => {
      setItems([])
      setLoading(false)
    }, 0)
    return () => window.clearTimeout(resetTimer)
  }, [user, load])

  async function handleDelete(id: string) {
    if (deleteArmedId !== id) {
      setDeleteArmedId(id)
      window.setTimeout(() => {
        setDeleteArmedId((current) => (current === id ? null : current))
      }, 3000)
      return
    }
    setDeleteArmedId(null)
    try {
      await deleteAssessment(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Deleting failed — please retry.',
      )
    }
  }

  const filteredItems = items.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      item.propertyName.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">My Reports</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Saved assessments from your account.
          </p>
        </div>
        <Link
          to="/new-assessment"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Start New Assessment
        </Link>
      </div>

      {!isSupabaseConfigured ? (
        <section className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CloudUpload className="size-6" aria-hidden="true" />
          </span>
          <h3 className="text-base font-semibold text-slate-900">Cloud saving not configured</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Create a Supabase project, run <code className="rounded bg-slate-100 px-1">supabase/schema.sql</code>{' '}
            in its SQL editor and add the two keys from{' '}
            <code className="rounded bg-slate-100 px-1">.env.example</code> to a{' '}
            <code className="rounded bg-slate-100 px-1">.env</code> file. Until then this page
            cannot show saved assessments.
          </p>
        </section>
      ) : authLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !user ? (
        <EmptyState
          icon={FileText}
          title="Sign in to see your reports"
          description="Assessments are private to your account. Sign in or create a free account to save and view them."
          action={
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Sign in / Create account
            </Link>
          }
        />
      ) : (
        <>
          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No saved assessments yet"
              description="Complete an assessment and press “Save to my account” on the results screen."
              action={
                <Link
                  to="/new-assessment"
                  className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Start New Assessment
                </Link>
              }
            />
          ) : (
            <>
              {items.length > 3 ? (
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by property or location…"
                  aria-label="Search assessments"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 sm:max-w-sm"
                />
              ) : null}

              {filteredItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                  No assessments match “{query.trim()}”.
                </p>
              ) : (
                <ul className="space-y-3">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.propertyName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.location} · {formatDate(item.createdAt)} ·{' '}
                          {formatNumber(item.roofAreaSqm)} m² roof
                          {item.harvestKl !== null
                            ? ` · ${formatNumber(item.harvestKl, 1)} kL/yr potential`
                            : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          to={`/reports/${item.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          View report
                        </Link>
                        <button
                          type="button"
                          onClick={() => void load()}
                          aria-label={`Refresh ${item.propertyName}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <RotateCw className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          aria-label={
                            deleteArmedId === item.id
                              ? `Confirm deleting ${item.propertyName}`
                              : `Delete ${item.propertyName}`
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                            deleteArmedId === item.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {deleteArmedId === item.id ? (
                            <>Confirm delete?</>
                          ) : (
                            <>
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
