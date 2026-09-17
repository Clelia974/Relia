import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportRawBackupToFile, exportWorkspaceToFile, parseWorkspaceFile } from '@/lib/workspace/importExport'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseWorkspaceFile — import JSON valide', () => {
  it('accepte un fichier contenant un workspace valide au schéma courant', async () => {
    const workspace = createEmptyWorkspace()
    const file = new File([JSON.stringify(workspace)], 'sauvegarde.json', { type: 'application/json' })

    const result = await parseWorkspaceFile(file)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(workspace.schemaVersion)
  })
})

describe('parseWorkspaceFile — import JSON invalide', () => {
  it("rejette un fichier qui n'est pas du JSON, sans lever d'exception", async () => {
    const file = new File(['ceci n\'est pas du JSON'], 'sauvegarde.json', { type: 'application/json' })

    const result = await parseWorkspaceFile(file)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toMatch(/JSON valide/)
  })

  it('rejette un JSON valide mais qui ne correspond pas au schéma Workspace', async () => {
    const file = new File([JSON.stringify({ hello: 'world' })], 'sauvegarde.json', { type: 'application/json' })

    const result = await parseWorkspaceFile(file)

    expect(result.ok).toBe(false)
  })
})

describe('export de sauvegarde', () => {
  it('exportWorkspaceToFile déclenche un téléchargement sans lever d\'exception', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(() => exportWorkspaceToFile(createEmptyWorkspace())).not.toThrow()
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('exportRawBackupToFile exporte tel quel un contenu illisible, sans tenter de le reformater', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(() => exportRawBackupToFile('{contenu-corrompu-quelconque')).not.toThrow()
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })
})
