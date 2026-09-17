import type { ReactElement, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/app/ErrorBoundary'

afterEach(cleanup)

/**
 * React re-rejoue volontairement, en développement, l'erreur d'un rendu qui
 * a échoué (pour distinguer un vrai bug d'un accroc de rendu concurrent),
 * même une fois qu'un Error Boundary l'a correctement interceptée. Cette
 * seconde erreur remonte au global `window.onerror` — sans lien avec le bon
 * fonctionnement de l'Error Boundary lui-même — et ferait échouer la suite
 * de tests si on ne l'ignore pas explicitement ici.
 */
function ignoreReactErrorRecoveryNoise() {
  const handler = (event: ErrorEvent) => event.preventDefault()
  window.addEventListener('error', handler)
  return () => window.removeEventListener('error', handler)
}

function renderWithRouter(ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/mariages']}>
      <Routes>
        <Route path="/aujourdhui" element={<p>Page d'accueil</p>} />
        <Route path="*" element={<>{ui}</>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ErrorBoundary', () => {
  it("affiche l'écran de secours en français, sans stack trace, quand un composant enfant lève une erreur", () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stopIgnoring = ignoreReactErrorRecoveryNoise()

    function Bomb(): ReactElement {
      throw new Error('Erreur de test contrôlée')
    }

    renderWithRouter(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Une erreur inattendue s'est produite.")).toBeInTheDocument()
    expect(screen.getByText('Vos dernières données sauvegardées ne sont pas supprimées.')).toBeInTheDocument()
    expect(screen.getByText(/Identifiant d'erreur/)).toBeInTheDocument()
    expect(screen.queryByText(/Erreur de test contrôlée/)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/at Bomb/)

    consoleErrorSpy.mockRestore()
    stopIgnoring()
  })

  it("le bouton Réessayer réinitialise l'état de l'Error Boundary et réaffiche les enfants une fois l'erreur corrigée", () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stopIgnoring = ignoreReactErrorRecoveryNoise()

    const bombState = { shouldThrow: true }
    function Bomb() {
      if (bombState.shouldThrow) throw new Error('Erreur de test contrôlée')
      return <p>Contenu récupéré</p>
    }

    renderWithRouter(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Une erreur inattendue s'est produite.")).toBeInTheDocument()

    bombState.shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))

    expect(screen.getByText('Contenu récupéré')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
    stopIgnoring()
  })

  it("le bouton Revenir à l'accueil utilise la navigation existante", () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const stopIgnoring = ignoreReactErrorRecoveryNoise()

    function Bomb(): ReactElement {
      throw new Error('Erreur de test contrôlée')
    }

    renderWithRouter(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: "Revenir à l'accueil" }))

    expect(screen.getByText("Page d'accueil")).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
    stopIgnoring()
  })
})
