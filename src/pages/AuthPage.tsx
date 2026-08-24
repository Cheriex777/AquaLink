import { useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, Droplets, Loader2, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { describeAuthError, signInWithEmail, signUpWithEmail } from '../services/authService'

type AuthMode = 'signin' | 'signup'

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'

const benefits = [
  'Save assessments for every property',
  'Keep environmental snapshots with each report',
  'Return anytime to compare water potential',
]

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setInfo(null)

    try {
      if (mode === 'signup') {
        const outcome = await signUpWithEmail(email.trim(), password)
        if (outcome.needsEmailConfirmation) {
          setInfo('Account created. Check your inbox to confirm your email, then sign in.')
        } else {
          navigate('/dashboard', { replace: true })
        }
      } else {
        await signInWithEmail(email.trim(), password)
        navigate('/dashboard', { replace: true })
      }
    } catch (authError) {
      setError(describeAuthError(authError))
    } finally {
      setBusy(false)
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <main className="min-h-dvh bg-slate-950">
      <div className="mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -left-28 -top-28 size-96 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-cyan-300/10 blur-3xl" />
          <Link to="/dashboard" className="relative inline-flex w-fit items-center gap-2.5 text-white">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-500 shadow-lg shadow-primary-500/20">
              <Droplets className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">JalSetu</span>
              <span className="block text-xs text-slate-400">Rainwater intelligence</span>
            </span>
          </Link>

          <div className="relative max-w-lg">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">
              Plan smarter. Save water.
            </p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Make every drop count.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              JalSetu turns local rainfall, rooftop area, and water demand into a practical harvesting plan for your property.
            </p>
            <ul className="mt-10 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="size-5 text-primary-300" aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-slate-500">Built for thoughtful water planning in India.</p>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link to="/dashboard" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 lg:hidden">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Droplets className="size-4" aria-hidden="true" />
              </span>
              JalSetu
            </Link>
            <div className="mb-8">
              <p className="text-sm font-semibold text-primary-700">Your water workspace</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isSignUp
                  ? 'Start saving your rainwater harvesting assessments in one place.'
                  : 'Sign in to continue planning your next assessment.'}
              </p>
            </div>

            {!configured ? (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
                Authentication is not connected yet. Add the Supabase values from <code>.env.example</code> to enable accounts.
              </div>
            ) : null}
            {error ? <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {info ? <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p> : null}

            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
              <label htmlFor="auth-page-email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input id="auth-page-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" />
              <label htmlFor="auth-page-password" className="mt-5 block text-sm font-medium text-slate-700">Password</label>
              <input id="auth-page-password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 6 characters" />
              <button type="submit" disabled={busy || !configured} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {isSignUp ? 'Create account' : 'Sign in'}
                {!busy ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
              </button>
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Your assessments are private to your account
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isSignUp ? 'Already have an account?' : 'New to JalSetu?'}{' '}
              <Link to={isSignUp ? '/login' : '/signup'} className="font-semibold text-primary-700 hover:text-primary-800">
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}