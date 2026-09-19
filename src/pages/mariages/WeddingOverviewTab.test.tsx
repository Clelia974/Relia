import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingOverviewTab } from '@/pages/mariages/WeddingOverviewTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingOverviewTab /> }],
    },
  ])
  return render(<RouterProvider router={router} />)
}

function setup(overrides: Partial<Wedding> = {}) {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-10-04T00:00:00.000Z',
    venue: 'Domaine des Roses',
    soldAmount: 15000,
    clientBudget: 15000,
    status: 'signe',
  })
  if (Object.keys(overrides).length > 0) {
    useWorkspaceStore.getState().updateWedding(weddingId, overrides)
  }
  const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
  return { weddingId, wedding }
}

describe('WeddingOverviewTab — modification du mariage', () => {
  it('affiche un bouton "Modifier" qui ouvre le formulaire', () => {
    const { wedding } = setup()
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    expect(screen.getByText('Modifier le mariage')).toBeTruthy()
  })

  it('enregistrer met à jour le mariage dans le store et affiche une confirmation', () => {
    const { weddingId, wedding } = setup()
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: 'Camille & Julien' } })
    fireEvent.change(screen.getByLabelText(/lieu du mariage/i), { target: { value: 'Château du Lac' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const updated = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    expect(updated.coupleName).toBe('Camille & Julien')
    expect(updated.venue).toBe('Château du Lac')
    expect(screen.queryByText('Modifier le mariage')).toBeNull()
  })

  it('cocher "Archiver ce mariage" met archived à true sans changer le statut', () => {
    const { weddingId, wedding } = setup()
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Archiver ce mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const updated = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    expect(updated.archived).toBe(true)
    expect(updated.status).toBe('signe')
  })

  it('décocher "Archiver ce mariage" sur un mariage archivé remet archived à false', () => {
    const { weddingId, wedding } = setup({ archived: true })
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Archiver ce mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const updated = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    expect(updated.archived).toBe(false)
  })

  it('annuler sans modification ne change rien dans le store', () => {
    const { weddingId, wedding } = setup()
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    const untouched = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    expect(untouched.coupleName).toBe('Camille & Antoine')
    expect(screen.queryByText('Modifier le mariage')).toBeNull()
  })

  it('conserve les tâches et prestataires liés après une modification du mariage', () => {
    const { weddingId, wedding } = setup()
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Julien Roussel', category: 'Traiteur', weddingIds: [weddingId] })
    const taskId = useWorkspaceStore
      .getState()
      .addTask({ weddingId, title: 'Confirmer le traiteur', dueDate: '2026-09-01T00:00:00.000Z', status: 'a_preparer', priority: 'normale', vendorId })

    renderWithWedding(wedding)
    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: 'Camille & Julien' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const state = useWorkspaceStore.getState().workspace
    expect(state.vendors.find((v) => v.id === vendorId)).toBeTruthy()
    expect(state.tasks.find((t) => t.id === taskId)).toBeTruthy()
    expect(state.vendors.find((v) => v.id === vendorId)?.weddingIds).toContain(weddingId)
  })

  it('affiche un avertissement quand la date change et que des événements de planning existent déjà', () => {
    const { weddingId, wedding } = setup()
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Cérémonie',
      date: wedding.date,
      startTime: '15:00',
      endTime: '16:00',
      type: 'jalon',
    })

    renderWithWedding(wedding)
    fireEvent.click(screen.getByRole('button', { name: 'Modifier les informations du mariage' }))
    expect(screen.queryByText(/planning existant ne sera pas automatiquement décalé/i)).toBeNull()

    fireEvent.change(screen.getByLabelText('Date du mariage'), { target: { value: '2026-11-01' } })
    expect(screen.getByText(/planning existant ne sera pas automatiquement décalé/i)).toBeTruthy()
  })
})
