import { describe, expect, it } from 'vitest'
import { useAuth } from '@/hooks/useAuth'

/**
 * Contrat de forme du mock — ProtectedRoute et AuthenticatedHeader ne
 * consomment que ces quatre champs. Tant que ce test passe, remplacer ce
 * mock par la vraie session Supabase (Phase 1) ne demande de changer que
 * ce fichier, jamais ses consommateurs.
 */
describe('useAuth (mock — Phase 1 le remplacera par la session Supabase)', () => {
  it('expose exactement user, isLoading, isAuthenticated, logout', () => {
    const result = useAuth()

    expect(Object.keys(result).sort()).toEqual(['isAuthenticated', 'isLoading', 'logout', 'user'])
    expect(typeof result.isAuthenticated).toBe('boolean')
    expect(typeof result.isLoading).toBe('boolean')
    expect(typeof result.logout).toBe('function')
    expect(result.user === null || typeof result.user?.id === 'string').toBe(true)
    expect(result.user === null || typeof result.user?.email === 'string').toBe(true)
  })

  it('reste authentifié (mock) tant que Supabase Auth n’est pas branché — ne doit jamais bloquer l’accès local', () => {
    const { isAuthenticated, user } = useAuth()

    expect(isAuthenticated).toBe(true)
    expect(user).not.toBeNull()
  })
})
