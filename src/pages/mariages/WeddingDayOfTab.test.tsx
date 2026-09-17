import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingDayOfTab } from '@/pages/mariages/WeddingDayOfTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingDayOfTab /> }],
    },
  ])
  return render(<RouterProvider router={router} />)
}

function seedWedding(date = '2026-06-06T00:00:00.000Z') {
  return useWorkspaceStore.getState().createWedding({
    coupleName: 'Test',
    date,
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
}

describe('WeddingDayOfTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it("1. affiche un état vide quand rien n'est prévu le jour du mariage", () => {
    const weddingId = seedWedding()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText(/Aucune tâche ni aucun moment prévu/)).toBeInTheDocument()
  })

  it('2. fusionne tâches et moments en une liste chronologique unique', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addTask({ title: 'Tâche du matin', weddingId, dueDate: '2026-06-06T08:00:00.000Z' })
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Coupe du gâteau',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '15:00',
      endTime: '15:30',
      type: 'jour_j',
    })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText('Tâche du matin')).toBeInTheDocument()
    expect(screen.getByText('Coupe du gâteau')).toBeInTheDocument()
  })

  it('3. coche une tâche depuis la vue jour J', () => {
    const weddingId = seedWedding()
    const taskId = useWorkspaceStore.getState().addTask({ title: 'Installer les chaises', weddingId, dueDate: '2026-06-06T08:00:00.000Z' })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Terminer' }))

    expect(useWorkspaceStore.getState().workspace.tasks.find((t) => t.id === taskId)?.status).toBe('terminee')
  })

  it('4. masque les éléments sans phase quand un filtre est restreint', () => {
    const weddingId = seedWedding()
    useWorkspaceStore.getState().addTask({ title: 'Tâche non classée', weddingId, dueDate: '2026-06-06T08:00:00.000Z' })
    useWorkspaceStore.getState().addTask({
      title: 'Tâche installation',
      weddingId,
      dueDate: '2026-06-06T09:00:00.000Z',
      phase: 'installation',
    })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Cérémonie' }))
    fireEvent.click(screen.getByRole('button', { name: 'Réception' }))
    fireEvent.click(screen.getByRole('button', { name: 'Démontage' }))

    expect(screen.queryByText('Tâche non classée')).not.toBeInTheDocument()
    expect(screen.getByText('Tâche installation')).toBeInTheDocument()
  })

  it("5. affiche un avertissement quand un moment jour J ne correspond plus à la date du mariage", () => {
    const weddingId = seedWedding('2026-06-06T00:00:00.000Z')
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Ancienne cérémonie',
      date: '2026-05-01T00:00:00.000Z',
      type: 'jour_j',
    })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText(/ne correspond.*plus à la date actuelle du mariage/)).toBeInTheDocument()
  })

  it('6. affiche les coordonnées du prestataire associé pour un accès rapide', () => {
    const weddingId = seedWedding()
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'DJ Mix', category: 'DJ', weddingIds: [weddingId], phone: '0600000000' })
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Arrivée DJ',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '10:00',
      endTime: '10:15',
      type: 'jour_j',
      vendorId,
    })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText('DJ Mix')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Appeler/ })).toHaveAttribute('href', 'tel:0600000000')
  })
})
