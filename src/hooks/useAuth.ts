import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
}

interface UseAuthResult {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user?.email) return null
  return { id: user.id, email: user.email }
}

/**
 * Session Supabase réelle (Étape 1 / Phase 1) — remplace le mock qui
 * renvoyait `isAuthenticated: true` en dur. Signature de retour inchangée
 * (user / isLoading / isAuthenticated / logout) : ProtectedRoute et
 * AuthenticatedHeader n'ont rien eu à modifier pour ce passage au réel
 * (cf. le contrat verrouillé par useAuth.test.ts).
 *
 * isLoading démarre à `true` : contrairement au mock, la session doit être
 * lue de manière asynchrone (`getSession`) avant de savoir si l'accès doit
 * être bloqué — les gardes de routing doivent attendre cet état avant de
 * décider quoi que ce soit (cf. LoadingScreen dans ProtectedRoute).
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setUser(toAuthUser(session?.user ?? null))
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null))
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    logout,
  }
}
