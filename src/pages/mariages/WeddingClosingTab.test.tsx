import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingClosingTab } from '@/pages/mariages/WeddingClosingTab'

afterEach(cleanup)

/**
 * Contexte réactif (relit le mariage depuis le store à chaque rendu), comme
 * le fait réellement WeddingLayout — un contexte figé au premier rendu ne
 * refléterait jamais closingSessionId après closeWedding/reopenWedding.
 */
function renderWithWedding(weddingId: string) {
  function ReactiveOutlet() {
    const wedding = useWorkspaceStore((s) => s.workspace.weddings.find((w) => w.id === weddingId))!
    return <Outlet context={{ wedding }} />
  }
  const router = createMemoryRouter([
    {
      path: '/',
      element: <ReactiveOutlet />,
      children: [{ index: true, element: <WeddingClosingTab /> }],
    },
  ])
  return render(<RouterProvider router={router} />)
}

function seedWedding() {
  return useWorkspaceStore.getState().createWedding({
    coupleName: 'Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 1000,
    clientBudget: 1000,
    status: 'semaine_j',
  })
}

function currentWedding(weddingId: string) {
  return useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
}

/** Radix Tabs n'active un déclencheur que sur une vraie séquence pointeur — un simple fireEvent.click ne suffit pas en jsdom. */
function selectTab(name: string) {
  const tab = screen.getByRole('tab', { name })
  fireEvent.mouseDown(tab)
  fireEvent.mouseUp(tab)
  fireEvent.click(tab)
}

describe('WeddingClosingTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it('1. affiche un aperçu du bilan et un bouton de clôture avant clôture', () => {
    const weddingId = seedWedding()
    renderWithWedding(weddingId)

    expect(screen.getByRole('button', { name: 'Clôturer le mariage' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rouvrir le mariage' })).not.toBeInTheDocument()
  })

  it('2. clôture le mariage et affiche le résumé figé', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addTask({ title: 'Tâche', weddingId, status: 'terminee' })
    renderWithWedding(weddingId)

    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le mariage' }))

    expect(screen.getByRole('button', { name: 'Rouvrir le mariage' })).toBeInTheDocument()
    const wedding = currentWedding(weddingId)
    expect(wedding.closingSessionId).toBeDefined()
  })

  it('3. réouvre le mariage et revient à un état modifiable', () => {
    const weddingId = seedWedding()
    renderWithWedding(weddingId)

    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rouvrir le mariage' }))

    expect(screen.getByRole('button', { name: 'Clôturer le mariage' })).toBeInTheDocument()
    expect(currentWedding(weddingId).closingSessionId).toBeUndefined()
  })

  it('4. permet de noter et commenter le feedback client une fois clôturé', async () => {
    const weddingId = seedWedding()
    renderWithWedding(weddingId)
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le mariage' }))

    selectTab('Feedback client')
    fireEvent.click(screen.getByRole('button', { name: '5 étoiles' }))
    fireEvent.change(screen.getByLabelText('Retour du client'), { target: { value: 'Très satisfaite' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le feedback' }))

    await waitFor(() => {
      const closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.weddingId === weddingId)
      expect(closing?.clientRating).toBe(5)
      expect(closing?.clientFeedback).toBe('Très satisfaite')
    })
  })
})
