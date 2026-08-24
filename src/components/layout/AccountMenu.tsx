import { useEffect, useRef, useState } from 'react'
import { CircleUserRound, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { describeAuthError, signOutUser } from '../../services/authService'

export default function AccountMenu() {
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOutUser()
      setMenuOpen(false)
      navigate('/login')
    } catch (error) {
      // Surface briefly in console-free UI: close menu; auth state unchanged.
      void describeAuthError(error)
    } finally {
      setSigningOut(false)
    }
  }

  if (!configured) return null

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => (user ? setMenuOpen((open) => !open) : navigate('/login'))}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <CircleUserRound className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">
          {loading ? '…' : user ? 'Account' : 'Sign in'}
        </span>
      </button>

      {user && menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
              {user.email ?? 'Unknown email'}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
