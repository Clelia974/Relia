import { useEffect, useState } from 'react'
import { fetchWorkspaceBackup } from '@/features/sync/workspaceBackup'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Une seule tentative par utilisateur et par chargement de page — ProtectedRoute remonte à chaque changement de route, ce module-level flag survit à ces remontages (remis à zéro seulement par un rechargement complet). */
let attemptedForUserId: string | null = null

interface UseAutoRestoreOnLoginResult {
  isRestoring: boolean
}

function willAttempt(isAuthenticated: boolean, userId: string | undefined, hasWorkspace: boolean): boolean {
  return isAuthenticated && userId !== undefined && !hasWorkspace && attemptedForUserId !== userId
}

/**
 * Restaure automatiquement la sauvegarde cloud — mais UNIQUEMENT si
 * l'espace local n'a jamais été onboardé (cf. `hasWorkspace`) : jamais si
 * un espace local existe déjà, pour ne jamais écraser un travail en
 * cours sur cet appareil. Utilisé par ProtectedRoute, donc déclenché à
 * chaque entrée dans l'app protégée, pas seulement au clic sur
 * "Se connecter" — couvre aussi un rechargement de page déjà connectée.
 *
 * `isRestoring` doit être vrai dès le tout premier rendu (pas seulement
 * une fois l'effet lancé) : sinon ProtectedRoute, qui décide de rediriger
 * vers /onboarding de façon synchrone pendant le rendu, prendrait cette
 * décision AVANT que l'effet n'ait eu la moindre chance de démarrer la
 * restauration — la redirection démonterait ce composant, coupant net la
 * requête en vol. D'où `useState(() => willAttempt(...))` en initialisation
 * paresseuse plutôt que `useState(false)`.
 *
 * Échec réseau : signalé en console, jamais bloquant — l'utilisatrice
 * atterrit simplement sur l'onboarding comme si rien n'existait dans le
 * cloud, elle peut toujours réessayer plus tard depuis /parametres une
 * fois son espace créé (import cloud non prévu pour l'instant, seul le
 * flux automatique au premier login existe).
 */
export function useAutoRestoreOnLogin(): UseAutoRestoreOnLoginResult {
  const { user, isAuthenticated } = useAuth()
  const hasWorkspace = useWorkspaceStore((s) => s.workspace.userProfile.onboarded)
  const replaceWorkspace = useWorkspaceStore((s) => s.replaceWorkspace)
  const [isRestoring, setIsRestoring] = useState(() => willAttempt(isAuthenticated, user?.id, hasWorkspace))

  useEffect(() => {
    // hasWorkspace volontairement absent des dépendances : replaceWorkspace() ci-dessous le fait passer à true
    // pendant que cet effet est en vol — s'il était dans les deps, ça relancerait l'effet (nettoyage → active = false)
    // avant que le .finally() de la promesse en cours n'ait pu repasser isRestoring à false, bloquant l'écran de
    // chargement indéfiniment. La valeur au moment du déclenchement (check ci-dessous) suffit : on ne veut réagir
    // qu'à un changement d'utilisateur/d'auth, jamais à notre propre écriture.
    if (!isAuthenticated || !user || hasWorkspace) return
    if (attemptedForUserId === user.id) return
    attemptedForUserId = user.id

    let active = true
    setIsRestoring(true)
    fetchWorkspaceBackup(user.id)
      .then((result) => {
        if (!active || !result.found || !result.workspace) return
        replaceWorkspace(result.workspace)
      })
      .catch((err: unknown) => {
        console.error('Restauration de la sauvegarde cloud impossible :', err)
      })
      .finally(() => {
        if (active) setIsRestoring(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, replaceWorkspace])

  return { isRestoring }
}
