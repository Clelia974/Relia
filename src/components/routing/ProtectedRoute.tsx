import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingScreen } from '@/components/routing/LoadingScreen'
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
 * l'onboarding ; sinon rend `children`. Pas encore branchée sur le routeur
 * de l'app (cf. router.tsx) — prête à l'être quand Supabase Auth (Phase 1)
 * remplacera le mock de useAuth.
 */
export function ProtectedRoute({ children, requireWorkspace = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasWorkspace, isLoading: workspaceLoading } = useWorkspaceCheck()

  if (authLoading || workspaceLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (requireWorkspace && !hasWorkspace) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
