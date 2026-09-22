import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/app/router'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)
beforeEach(() => useWorkspaceStore.setState({ workspace: createEmptyWorkspace() }))

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

/**
 * Verrou de non-régression pour la structure auth/routing mise "en
 * réserve" pour la Phase 1 (ProtectedRoute, AuthenticatedHeader, useAuth) :
 * rien n'est encore branché dans router.tsx, donc le routing actuel doit
 * rester strictement identique — aucune redirection ni en-tête
 * authentifié ne doit apparaître avant que ces composants soient
 * explicitement câblés.
 */
describe('AppRouter — routing actuel inchangé (structure auth réservée à la Phase 1)', () => {
  it('« / » affiche toujours la landing publique, sans en-tête authentifié', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aller à mon application' })).not.toBeInTheDocument()
  })

  it('une route de l’app reste accessible directement sans espace de travail onboardé — aucune redirection vers /onboarding n’a été introduite', () => {
    renderAt('/aujourdhui')

    expect(screen.getByRole('heading', { level: 1, name: 'Votre espace est prêt.' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).not.toBeInTheDocument()
  })
})
