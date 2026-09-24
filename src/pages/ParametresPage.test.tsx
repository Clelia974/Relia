import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ParametresPage } from '@/pages/ParametresPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/** useSyncToCloud/useRestoreFromCloud parlent à Supabase (réseau) — mockés ici pour isoler la page ; testés eux-mêmes dans leurs propres fichiers. */
const useSyncToCloudMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/sync/useSyncToCloud', () => ({ useSyncToCloud: useSyncToCloudMock }))
const useRestoreFromCloudMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/sync/useRestoreFromCloud', () => ({ useRestoreFromCloud: useRestoreFromCloudMock }))

const syncNowMock = vi.fn()
const restoreNowMock = vi.fn()

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  syncNowMock.mockReset()
  restoreNowMock.mockReset()
  useSyncToCloudMock.mockReturnValue({ syncNow: syncNowMock, isSyncing: false, error: null, lastSyncedAt: null })
  useRestoreFromCloudMock.mockReturnValue({ restoreNow: restoreNowMock, isRestoring: false, error: null })
})

describe('ParametresPage — sauvegarde en ligne', () => {
  it('le bouton "Sauvegarder maintenant" appelle syncNow', () => {
    render(<ParametresPage />)

    fireEvent.click(screen.getByRole('button', { name: /Sauvegarder maintenant/ }))

    expect(syncNowMock).toHaveBeenCalledOnce()
  })

  it('affiche le bouton en état de chargement pendant la synchronisation', () => {
    useSyncToCloudMock.mockReturnValue({ syncNow: syncNowMock, isSyncing: true, error: null, lastSyncedAt: null })

    render(<ParametresPage />)

    expect(screen.getByRole('button', { name: /Sauvegarder maintenant/ })).toBeDisabled()
  })

  it('affiche le message d’erreur en cas d’échec', () => {
    useSyncToCloudMock.mockReturnValue({ syncNow: syncNowMock, isSyncing: false, error: 'RLS violation', lastSyncedAt: null })

    render(<ParametresPage />)

    expect(screen.getByText('RLS violation')).toBeInTheDocument()
  })

  it('affiche la date de dernière sauvegarde une fois synchronisé', () => {
    useSyncToCloudMock.mockReturnValue({
      syncNow: syncNowMock,
      isSyncing: false,
      error: null,
      lastSyncedAt: '2026-09-22T14:32:00.000Z',
    })

    render(<ParametresPage />)

    expect(screen.getByText(/Dernière sauvegarde/)).toBeInTheDocument()
  })

  it('ne mentionne plus "aucun serveur" (devenu faux depuis la sauvegarde en ligne)', () => {
    render(<ParametresPage />)

    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/aucun serveur/i)
  })

  it('"Restaurer depuis le cloud" demande confirmation avant d’écraser les données locales, puis remplace le workspace', async () => {
    const backup = { ...createEmptyWorkspace(), weddings: [], tasks: [] }
    restoreNowMock.mockResolvedValue(backup)
    render(<ParametresPage />)

    fireEvent.click(screen.getByRole('button', { name: /Restaurer depuis le cloud/ }))
    expect(await screen.findByText('Remplacer vos données actuelles ?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }))
    expect(useWorkspaceStore.getState().workspace).toBe(backup)
  })

  it('aucune confirmation si le cloud ne renvoie rien (pas de sauvegarde, ou erreur déjà affichée par le hook)', async () => {
    restoreNowMock.mockResolvedValue(null)
    render(<ParametresPage />)

    fireEvent.click(screen.getByRole('button', { name: /Restaurer depuis le cloud/ }))
    await Promise.resolve()

    expect(screen.queryByText('Remplacer vos données actuelles ?')).not.toBeInTheDocument()
  })
})

describe('ParametresPage — cartes réduites (moins de pollution visuelle)', () => {
  it('Profil & entreprise fusionnés : aucun champ visible tant que "Modifier" n’est pas cliqué, tout apparaît ensuite dans la même fenêtre', () => {
    useWorkspaceStore.setState((state) => ({
      workspace: { ...state.workspace, businessConfig: { ...state.workspace.businessConfig, companyName: 'Atelier Fleur de Lien' } },
    }))
    render(<ParametresPage />)

    expect(screen.getByText('Atelier Fleur de Lien')).toBeInTheDocument()
    expect(screen.queryByLabelText('Votre prénom')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/SIRET/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    expect(screen.getByLabelText('Votre prénom')).toBeInTheDocument()
    expect(screen.getByLabelText(/Votre nom/)).toBeInTheDocument()
    expect(screen.getByLabelText(/SIRET/)).toBeInTheDocument()
  })
})
