import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/routing/LoadingScreen'
import { useAutoRestoreOnLogin } from '@/features/sync/useAutoRestoreOnLogin'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceCheck } from '@/hooks/useWorkspaceCheck'

interface ProtectedRouteProps {
  children: ReactNode
  /** Exige un espace de travail onboardé en plus de l'authentification — désactivable pour une route protégée qui n'en a pas besoin (ex. l'onboarding lui-même une fois l'auth réelle branchée). */
  requireWorkspace?: boolean
}

/**
 * Garde de routing générique : non authentifié → renvoie à la landing ;
 * authentifié sans espace onboardé (si `requireWorkspace`) → renvoie à
 * l'onboarding ; sinon rend `children`.
 *
 * Tente d'abord une restauration cloud (`useAutoRestoreOnLogin`) — c'est
 * ici, pas dans LoginPage, que ça se déclenche : ça couvre aussi bien le
 * clic sur "Se connecter" qu'un rechargement de page déjà authentifiée, et
 * ça s'applique quelle que soit la route protégée d'entrée. No-op immédiat
 * si un espace local existe déjà (jamais d'écrasement), donc jamais
 * exécuté pendant un mariage en cours (Vue Jour J implique un espace
 * onboardé).
 */
export function ProtectedRoute({ children, requireWorkspace = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasWorkspace, isLoading: workspaceLoading } = useWorkspaceCheck()
  const { isRestoring } = useAutoRestoreOnLogin()

  if (authLoading || workspaceLoading || isRestoring) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (requireWorkspace && !hasWorkspace) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
