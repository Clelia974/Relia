import { useEffect, useState } from 'react'
import { fetchOwnUserProfile, type UserProfile } from '@/features/auth/userProfile'
import { useAuth } from '@/hooks/useAuth'

interface UseUserProfileResult {
  profile: UserProfile | null
  isLoading: boolean
  /** Message d'erreur si la lecture a échoué (réseau, RLS…) — distinct de `profile === null` après un chargement réussi, qui signale une ligne manquante (trigger n'a pas tourné). */
  error: string | null
}

interface Resolved {
  userId: string
  profile: UserProfile | null
  error: string | null
}

/**
 * `profile`/`error` restent dérivés de `resolved` plutôt que remis à zéro
 * par un `setState` synchrone dans l'effet (évite un rendu superflu, cf.
 * react/set-state-in-effect) : tant que `resolved` ne correspond pas à
 * l'utilisateur courant (pas encore chargé, ou plus d'utilisateur), on
 * expose `null`/`isLoading` calculés au rendu, jamais l'état d'un
 * utilisateur précédent.
 */
export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth()
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchOwnUserProfile(user.id)
      .then((result) => {
        if (!active) return
        setResolved({ userId: user.id, profile: result, error: null })
        if (result === null) {
          // Ne bloque rien : signalé pour investigation, jamais affiché à l'utilisatrice.
          console.error(`Profil public.users introuvable pour l'utilisateur ${user.id} — le trigger on_auth_user_created a-t-il tourné ?`)
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        setResolved({ userId: user.id, profile: null, error: err instanceof Error ? err.message : 'Erreur lors de la lecture du profil.' })
      })
    return () => {
      active = false
    }
  }, [user])

  const isCurrent = user !== null && resolved !== null && resolved.userId === user.id

  return {
    profile: isCurrent ? resolved.profile : null,
    isLoading: user !== null && !isCurrent,
    error: isCurrent ? resolved.error : null,
  }
}
