import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingEquipmentTab } from '@/pages/mariages/WeddingEquipmentTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingEquipmentTab /> }],
    },
  ])
  return render(<RouterProvider router={router} />)
}

function seedWedding() {
  return useWorkspaceStore.getState().createWedding({
    coupleName: 'Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
}

describe('WeddingEquipmentTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it("1. affiche un état vide quand aucun élément n'existe", () => {
    const weddingId = seedWedding()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText(/Aucun élément pour l'instant/)).toBeInTheDocument()
  })

  it('2. ajoute un élément via le formulaire', () => {
    const weddingId = seedWedding()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: /Ajouter un élément/ }))
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Chaises pliantes' } })
    fireEvent.change(screen.getByLabelText('Quantité nécessaire'), { target: { value: '80' } })

    // Mode d'obtention est un Select Radix requis — sélection via clic natif.
    fireEvent.click(screen.getByLabelText("Mode d'obtention"))
    fireEvent.click(screen.getByRole('option', { name: 'Location' }))

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Chaises pliantes')).toBeInTheDocument()
    expect(screen.getByText('Quantité : 80')).toBeInTheDocument()
    const item = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.name === 'Chaises pliantes')
    expect(item?.acquisitionMode).toBe('location')
    expect(item?.status).toBe('a_prevoir')
  })

  it('3. supprime un élément après confirmation', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Nappes', quantity: 12, acquisitionMode: 'achat' })
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Nappes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(screen.queryByText('Nappes')).not.toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.equipmentItems).toHaveLength(0)
  })

  it('4. filtre par statut', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })
    const id2 = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Tables', quantity: 10, acquisitionMode: 'location' })
    useWorkspaceStore.getState().updateEquipmentItemStatus(id2, 'pret')

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByLabelText('Filtrer par statut'))
    fireEvent.click(screen.getByRole('option', { name: 'Prêt' }))

    expect(screen.queryByText('Chaises')).not.toBeInTheDocument()
    expect(screen.getByText('Tables')).toBeInTheDocument()
  })
})
