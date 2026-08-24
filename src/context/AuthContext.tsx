import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getExistingSession, subscribeToAuthChanges } from '../services/authService'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { AuthContext } from '../hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const timer = window.setTimeout(() => {
        setUser(null)
        setLoading(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let cancelled = false

    getExistingSession()
      .then((session) => {
        if (!cancelled) setUser(session?.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const unsubscribe = subscribeToAuthChanges((session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const openAuthModal = useMemo(() => () => setAuthModalOpen(true), [])
  const closeAuthModal = useMemo(() => () => setAuthModalOpen(false), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
    }),
    [user, loading, authModalOpen, openAuthModal, closeAuthModal],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
