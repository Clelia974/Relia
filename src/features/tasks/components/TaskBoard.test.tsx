import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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

    render(<TaskBoard />)

    expect(screen.queryByText('Tâche du mariage archivé')).not.toBeInTheDocument()
  })

  it("2. une tâche d'un mariage actif apparaît", () => {
    const activeWeddingId = seedWedding('Mariage Actif', false)
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage actif', weddingId: activeWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })

    render(<TaskBoard />)

    expect(screen.getByText('Tâche du mariage actif')).toBeInTheDocument()
  })

  it('3. une tâche sans weddingId apparaît', () => {
    useWorkspaceStore.getState().addTask({ title: 'Tâche générique', dueDate: '2026-06-01T00:00:00.000Z' })

    render(<TaskBoard />)

    expect(screen.getByText('Tâche générique')).toBeInTheDocument()
  })

  it('mélange : seules les tâches du mariage archivé sont absentes', () => {
    const activeWeddingId = seedWedding('Mariage Actif', false)
    const archivedWeddingId = seedWedding('Mariage Archivé', true)
    useWorkspaceStore.getState().addTask({ title: 'Tâche active', weddingId: activeWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche archivée', weddingId: archivedWeddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTask({ title: 'Tâche générique', dueDate: '2026-06-01T00:00:00.000Z' })

    render(<TaskBoard />)

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

    render(<TaskBoard scopeWeddingId={archivedWeddingId} />)

    // Depuis la fiche d'un mariage (même archivé), ses propres tâches restent visibles.
    expect(screen.getByText('Tâche du mariage archivé')).toBeInTheDocument()
    expect(screen.queryByText('Tâche autre mariage')).not.toBeInTheDocument()
  })
})
