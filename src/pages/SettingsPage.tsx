import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CloudUpload,
  Database,
  ExternalLink,
  LogOut,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { signOutUser } from '../services/authService'
import { ENGINE_VERSION } from '../services/calculationService'
import { RESOURCES } from '../content/guidelines'

const cardClass = 'rounded-xl border border-slate-200 bg-white'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOutUser()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-0.5 text-sm text-slate-500">Account, engine and data sources.</p>
      </div>

      <section aria-label="Account" className={`${cardClass} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">Account</h3>
        {!isSupabaseConfigured ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <CloudUpload className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Supabase not configured — add keys to <code className="rounded bg-amber-100 px-1">.env</code>{' '}
              (see .env.example) and run supabase/schema.sql to enable accounts.
            </span>
          </div>
        ) : authLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Checking session…
          </p>
        ) : user ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                {(user.email ?? '?').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{user.email}</p>
                <p className="text-xs text-slate-400">
                  Assessments are protected by row-level security — only you can see them.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="size-3.5" aria-hidden="true" />
              )}
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">You are browsing without an account.</p>
            <Link
              to="/login"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Sign in / Create account
            </Link>
          </div>
        )}
      </section>

      <section aria-label="Privacy" className={`${cardClass} p-5`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
          Data privacy
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>• Assessments are stored with row-level security on the server — access cannot be granted through the app alone.</li>
          <li>• Unsaved assessments live only in this browser's local draft storage.</li>
        </ul>
      </section>

      <section aria-label="About" className={`${cardClass} p-5`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Database className="size-4 text-primary-600" aria-hidden="true" />
          About the engine
        </h3>
        <dl className="mt-2 divide-y divide-slate-50 text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Calculation engine</dt>
            <dd className="font-medium text-slate-900">JalSetu v{ENGINE_VERSION}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Core formula</dt>
            <dd className="text-right font-medium text-slate-900">
              Roof area × Rainfall × Runoff coeff × Efficiency
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900">
              Indicative feasibility estimates — verify on site
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Data sources" className={`${cardClass} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">Data sources</h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RESOURCES.map((resource) => (
            <li key={resource.title}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-primary-300 hover:bg-primary-50/40"
              >
                <span>
                  <span className="block font-medium text-slate-800 group-hover:text-primary-700">
                    {resource.publisher}
                  </span>
                  <span className="block text-[11px] text-slate-400">{resource.title}</span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
