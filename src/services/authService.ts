import type { Session, User } from '@supabase/supabase-js'
import { supabase, requireSupabase } from './supabaseClient'

const FRIENDLY_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Incorrect email or password.',
  user_already_exists:
    'An account with this email already exists — try signing in instead.',
  weak_password: 'Password must be at least 6 characters.',
  email_not_confirmed:
    'Please confirm your email address first (check your inbox).',
  over_request_rate_limit: 'Too many attempts — please wait a minute and retry.',
  email_address_invalid: 'That email address does not look valid.',
}

export function describeAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code)
    if (FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code]
  }
  if (error instanceof Error && error.message) return error.message
  return 'Authentication failed — please try again.'
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ user: User | null; needsEmailConfirmation: boolean }> {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  // If email confirmation is enabled in the Supabase project, no session yet.
  return { user: data.user, needsEmailConfirmation: data.session === null }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Session> {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('Sign-in succeeded but no session was returned.')
  return data.session
}

export async function signOutUser(): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function getExistingSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session ?? null
}

export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
): () => void {
  if (!supabase) {
    callback(null)
    return () => {}
  }
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => subscription.unsubscribe()
}
