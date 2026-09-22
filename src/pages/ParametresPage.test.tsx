import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ParametresPage } from '@/pages/ParametresPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/** useSyncToCloud parle à Supabase (réseau) — mocké ici pour isoler la page ; le hook lui-même est testé dans useSyncToCloud.test.ts. */
const useSyncToCloudMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/sync/useSyncToCloud', () => ({ useSyncToCloud: useSyncToCloudMock }))

const syncNowMock = vi.fn()

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  syncNowMock.mockReset()
  useSyncToCloudMock.mockReturnValue({ syncNow: syncNowMock, isSyncing: false, error: null, lastSyncedAt: null })
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
})
