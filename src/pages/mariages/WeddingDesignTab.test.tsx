import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingDesignTab } from '@/pages/mariages/WeddingDesignTab'

afterEach(cleanup)

const useSubscriptionCheckMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useSubscriptionCheck', () => ({ useSubscriptionCheck: useSubscriptionCheckMock }))

function seedAndRender() {
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
  // Le layout relit le mariage dans le store à chaque rendu : on fait pareil ici.
  function Layout() {
    const wedding = useWorkspaceStore((s) => s.workspace.weddings.find((w) => w.id === weddingId))!
    return <Outlet context={{ wedding }} />
  }
  const router = createMemoryRouter([{ path: '/', element: <Layout />, children: [{ index: true, element: <WeddingDesignTab /> }] }])
  render(<RouterProvider router={router} />)
  return weddingId
}

const createBoard = (title: string) => {
  fireEvent.click(screen.getByRole('button', { name: /Nouveau moodboard/ }))
  fireEvent.change(screen.getByLabelText('Nom du moodboard'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Créer' }))
}

describe('WeddingDesignTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    useSubscriptionCheckMock.mockReturnValue({ status: 'active', isLoading: false })
  })

  it('enregistre style, matières et ambiance dans le mariage', () => {
    const weddingId = seedAndRender()
    fireEvent.change(screen.getByLabelText('Ajouter — Style'), { target: { value: 'Bohème' } })
    fireEvent.keyDown(screen.getByLabelText('Ajouter — Style'), { key: 'Enter' })
    fireEvent.change(screen.getByLabelText('Ajouter — Matières'), { target: { value: 'Lin' } })
    fireEvent.keyDown(screen.getByLabelText('Ajouter — Matières'), { key: 'Enter' })
    fireEvent.change(screen.getByLabelText('Ambiance'), { target: { value: 'Dîner sous les oliviers' } })
    fireEvent.blur(screen.getByLabelText('Ambiance'))

    const design = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)?.design
    expect(design).toEqual({ styleKeywords: ['Bohème'], palette: [], materials: ['Lin'], ambiance: 'Dîner sous les oliviers' })
  })

  it('crée un moodboard et l’affiche dans la liste', () => {
    seedAndRender()
    createBoard('Cérémonie')
    expect(useWorkspaceStore.getState().workspace.moodboards.map((b) => b.title)).toEqual(['Cérémonie'])
    expect(screen.getByRole('link', { name: 'Ouvrir le moodboard Cérémonie' })).toHaveAttribute('href', '/moodboards/' + useWorkspaceStore.getState().workspace.moodboards[0].id)
  })

  it('version Gratuite : un seul moodboard, puis le bouton est désactivé', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'expired', isLoading: false })
    seedAndRender()
    expect(screen.getByText(/Version Gratuite/)).toBeInTheDocument()
    createBoard('Réception')
    expect(screen.getByRole('button', { name: /Nouveau moodboard/ })).toBeDisabled()
  })
})
