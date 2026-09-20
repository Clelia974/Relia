import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
})

function seedWedding(coupleName: string, archived = false) {
  const id = useWorkspaceStore.getState().createWedding({
    coupleName,
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 0,
    clientBudget: 0,
    status: 'signe',
  })
  if (archived) useWorkspaceStore.getState().archiveWedding(id)
  return id
}

describe('TaskBoard — périmètre global (scopeWeddingId non défini)', () => {
  it("1. une tâche d'un mariage archivé n'apparaît pas", () => {
    const archivedWeddingId = seedWedding('Mariage Archivé', true)
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage archivé', weddingId: archivedWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    expect(screen.queryByText('Tâche du mariage archivé')).not.toBeInTheDocument()
  })

  it("2. une tâche d'un mariage actif apparaît", () => {
    const activeWeddingId = seedWedding('Mariage Actif', false)
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage actif', weddingId: activeWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    expect(screen.getByText('Tâche du mariage actif')).toBeInTheDocument()
  })

  it('3. une tâche sans weddingId apparaît', () => {
    useWorkspaceStore.getState().addTask({ title: 'Tâche générique', dueDate: '2026-06-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    expect(screen.getByText('Tâche générique')).toBeInTheDocument()
  })

  it('mélange : seules les tâches du mariage archivé sont absentes', () => {
    const activeWeddingId = seedWedding('Mariage Actif', false)
    const archivedWeddingId = seedWedding('Mariage Archivé', true)
    useWorkspaceStore.getState().addTask({ title: 'Tâche active', weddingId: activeWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche archivée', weddingId: archivedWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche générique', dueDate: '2026-06-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    expect(screen.getByText('Tâche active')).toBeInTheDocument()
    expect(screen.getByText('Tâche générique')).toBeInTheDocument()
    expect(screen.queryByText('Tâche archivée')).not.toBeInTheDocument()
  })
})

describe('TaskBoard — périmètre scopé (scopeWeddingId défini)', () => {
  it("4. le filtrage par mariage sélectionné continue de fonctionner, y compris pour un mariage archivé (vue détail)", () => {
    const archivedWeddingId = seedWedding('Mariage Archivé', true)
    const otherWeddingId = seedWedding('Autre Mariage', false)
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage archivé', weddingId: archivedWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche autre mariage', weddingId: otherWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard scopeWeddingId={archivedWeddingId} />
      </TooltipProvider>,
    )

    // Depuis la fiche d'un mariage (même archivé), ses propres tâches restent visibles.
    expect(screen.getByText('Tâche du mariage archivé')).toBeInTheDocument()
    expect(screen.queryByText('Tâche autre mariage')).not.toBeInTheDocument()
  })
})

describe('TaskBoard — cartes de synthèse (Phase 1)', () => {
  it("aucune tâche : état vide affiché, pas de rangée de cartes", () => {
    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    expect(screen.queryByRole('group', { name: /Synthèse des tâches/ })).not.toBeInTheDocument()
  })

  it('compte correctement total / à faire / en retard / urgentes / en attente de paiement', () => {
    useWorkspaceStore.getState().addTask({ title: 'À faire simple', status: 'a_faire', dueDate: '2030-01-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'En retard', status: 'a_faire', dueDate: '2020-01-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Urgente active', status: 'en_cours', priority: 'urgente' })
    useWorkspaceStore.getState().addTask({
      title: 'Attend un paiement',
      status: 'en_attente',
      waitingOn: 'paiement',
    })
    useWorkspaceStore.getState().addTask({ title: 'Terminée', status: 'terminee' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    const group = screen.getByRole('group', { name: /Synthèse des tâches/ })
    expect(within(group).getByRole('button', { name: /^Total : 5/ })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: /^À faire : 2/ })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: /^En retard : 1/ })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: /^Tâches urgentes : 1/ })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: /^En attente d'un paiement : 1/ })).toBeInTheDocument()
  })

  it('cliquer "En retard" filtre la liste et affiche le filtre comme actif', () => {
    useWorkspaceStore.getState().addTask({ title: 'Tâche à jour', status: 'a_faire', dueDate: '2030-01-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche en retard', status: 'a_faire', dueDate: '2020-01-01T00:00:00.000Z' })

    render(
      <TooltipProvider>
        <TaskBoard />
      </TooltipProvider>,
    )

    const group = screen.getByRole('group', { name: /Synthèse des tâches/ })
    const overdueCard = within(group).getByRole('button', { name: /^En retard : 1/ })
    fireEvent.click(overdueCard)

    expect(overdueCard).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Tâche en retard')).toBeInTheDocument()
    expect(screen.queryByText('Tâche à jour')).not.toBeInTheDocument()
  })

  it('les cartes de synthèse restent disponibles en périmètre scopé (mariage précis)', () => {
    const weddingId = seedWedding('Mariage Scopé')
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage', weddingId, status: 'a_faire', priority: 'urgente' })

    render(
      <TooltipProvider>
        <TaskBoard scopeWeddingId={weddingId} />
      </TooltipProvider>,
    )

    const group = screen.getByRole('group', { name: /Synthèse des tâches/ })
    expect(within(group).getByRole('button', { name: /^Tâches urgentes : 1/ })).toBeInTheDocument()
  })
})
