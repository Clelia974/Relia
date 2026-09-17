import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingBreakdownTab } from '@/pages/mariages/WeddingBreakdownTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingBreakdownTab /> }],
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

describe('WeddingBreakdownTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it("1. affiche un état vide quand aucun élément matériel n'existe", () => {
    const weddingId = seedWedding()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText(/Aucun élément matériel pour ce mariage/)).toBeInTheDocument()
  })

  it('2. groupe les éléments par zone et affiche le résumé', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Guirlandes', quantity: 5, acquisitionMode: 'stock_personnel', category: 'Cérémonie' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText('Réception')).toBeInTheDocument()
    expect(screen.getByText('Cérémonie')).toBeInTheDocument()
    expect(screen.getByText('Chaises')).toBeInTheDocument()
    expect(screen.getByText('0/2')).toBeInTheDocument()
  })

  it("3. coche un élément comme récupéré, ce qui déclenche l'offre de destination", () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Marquer comme récupéré' }))

    expect(screen.getByRole('button', { name: 'Indiquer la destination' })).toBeInTheDocument()
    const item = useWorkspaceStore.getState().workspace.equipmentItems[0]
    expect(item.status).toBe('recupere')
    expect(item.returnedAt).toBeDefined()
  })

  it('4. signale un dégât via le formulaire inline', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Signaler un dégât' }))
    fireEvent.change(screen.getByPlaceholderText(/pied cassé/), { target: { value: 'Pied cassé' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le dégât' }))

    expect(screen.getByText(/Endommagé — Pied cassé/)).toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.equipmentItems[0].isDamaged).toBe(true)
  })

  it('5. crée les tâches de démontage par zone, une seule fois (anti-doublon)', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Commencer le démontage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer les tâches de démontage' }))

    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
    expect(useWorkspaceStore.getState().workspace.tasks[0].title).toBe('Démontage : Réception')

    fireEvent.click(screen.getByRole('button', { name: 'Commencer le démontage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer les tâches de démontage' }))
    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
  })

  it('6. affiche le bandeau "Démontage complet" une fois tout récupéré avec destination', () => {
    const weddingId = seedWedding()
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })
    useWorkspaceStore.getState().updateEquipmentItem(id, { status: 'recupere', destination: 'stock' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText('Démontage complet')).toBeInTheDocument()
    expect(screen.getByText(/Tous les éléments ont été récupérés\./)).toBeInTheDocument()
  })
})
