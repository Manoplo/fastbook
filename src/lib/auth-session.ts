import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

export async function getAuthSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw error
  }
  return data.session
}

export async function getAuthUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    throw error
  }
  return data.user
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return () => {
    subscription.unsubscribe()
  }
}
