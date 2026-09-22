import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWorkspaceBackup, pushWorkspaceBackup } from '@/features/sync/workspaceBackup'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

const { maybeSingleMock, eqMock, selectMock, upsertMock, fromMock } = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const upsertMock = vi.fn()
  const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }))
  return { maybeSingleMock, eqMock, selectMock, upsertMock, fromMock }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

beforeEach(() => {
  fromMock.mockClear()
  selectMock.mockClear()
  eqMock.mockClear()
  maybeSingleMock.mockReset()
  upsertMock.mockReset()
})

describe('fetchWorkspaceBackup', () => {
  it("found: false quand aucune sauvegarde n'existe (pas une erreur)", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })

    const result = await fetchWorkspaceBackup('u1')

    expect(fromMock).toHaveBeenCalledWith('workspace_backups')
    expect(eqMock).toHaveBeenCalledWith('user_id', 'u1')
    expect(result).toEqual({ found: false, workspace: null })
  })

  it('valide/migre les données lues (migrateWorkspace), comme un import de fichier JSON', async () => {
    const workspace = createEmptyWorkspace()
    maybeSingleMock.mockResolvedValue({ data: { data: workspace }, error: null })

    const result = await fetchWorkspaceBackup('u1')

    expect(result.found).toBe(true)
    expect(result.workspace?.userProfile).toEqual(workspace.userProfile)
  })

  it('lève une erreur explicite si les données stockées sont invalides — jamais un null silencieux', async () => {
    maybeSingleMock.mockResolvedValue({ data: { data: { pas: 'un workspace valide' } }, error: null })

    await expect(fetchWorkspaceBackup('u1')).rejects.toThrow(/Sauvegarde cloud illisible/)
  })

  it('propage une erreur Supabase', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })

    await expect(fetchWorkspaceBackup('u1')).rejects.toEqual({ message: 'RLS violation' })
  })
})

describe('pushWorkspaceBackup', () => {
  it('upsert la ligne sans préciser onConflict (user_id est la clé primaire)', async () => {
    upsertMock.mockResolvedValue({ error: null })
    const workspace = createEmptyWorkspace()

    await pushWorkspaceBackup('u1', workspace)

    expect(fromMock).toHaveBeenCalledWith('workspace_backups')
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', data: workspace, synced_at: expect.any(String) }),
    )
  })

  it('propage une erreur Supabase', async () => {
    upsertMock.mockResolvedValue({ error: { message: 'Network error' } })

    await expect(pushWorkspaceBackup('u1', createEmptyWorkspace())).rejects.toEqual({ message: 'Network error' })
  })
})
