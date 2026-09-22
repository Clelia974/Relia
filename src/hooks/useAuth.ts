export interface AuthUser {
  id: string
  email: string
}

interface UseAuthResult {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

/**
 * Mock en attendant Supabase Auth (Phase 1) — seul module à remplacer
 * quand l'authentification réelle arrivera : la signature (user /
 * isLoading / isAuthenticated / logout) ne doit pas changer, pour que
 * ProtectedRoute et AuthenticatedHeader n'aient rien à modifier de leur
 * côté.
 *
 * isAuthenticated reste à `true` (avec un utilisateur local placeholder)
 * tant qu'il n'y a pas de vrai compte : sans ça, comme aucune session
 * réelle ne peut jamais exister avant Supabase, un mock à `false` rendrait
 * silencieusement inaccessibles toutes les routes protégées par l'auth —
 * en local comme en prod. Le routing reste piloté par l'état de l'espace
 * de travail (cf. useWorkspaceCheck), pas par l'auth, jusqu'à Phase 1.
 */
export function useAuth(): UseAuthResult {
  return {
    user: { id: 'local-user', email: 'local@relia.app' },
    isLoading: false,
    isAuthenticated: true,
    logout: () => {},
  }
}
