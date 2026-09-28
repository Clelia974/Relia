import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useShareDevis } from '@/features/proposals/useShareDevis'
import type { DevisSnapshot } from '@/features/proposals/devisSnapshot'

const getSessionMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: getSessionMock } } }))

const snapshot = { title: 'Devis mariage' } as unknown as DevisSnapshot

beforeEach(() => {
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useShareDevis', () => {
  it('envoie le jeton de session courant (jamais un userId affirmé par le client) et renvoie l’id partagé', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, shareId: 'share-abc' }) })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useShareDevis())

    let shareId: string | null = null
    await act(async () => {
      shareId = await result.current.shareDevis({ snapshot, clientEmail: 'sophie@example.com', clientName: 'Sophie Martin' })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/devis/share',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-abc' },
        body: JSON.stringify({ snapshot, clientEmail: 'sophie@example.com', clientName: 'Sophie Martin' }),
      }),
    )
    expect(shareId).toBe('share-abc')
    expect(result.current.error).toBeNull()
  })

  it('expose une erreur lisible si le serveur refuse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Devis invalide.' }) }))

    const { result } = renderHook(() => useShareDevis())

    let shareId: string | null = 'not-null'
    await act(async () => {
      shareId = await result.current.shareDevis({ snapshot, clientName: 'Sophie Martin' })
    })

    expect(shareId).toBeNull()
    expect(result.current.error).toBe('Devis invalide.')
    expect(result.current.isLoading).toBe(false)
  })

  it('refuse sans session active, sans appeler le serveur', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useShareDevis())

    let shareId: string | null = 'not-null'
    await act(async () => {
      shareId = await result.current.shareDevis({ snapshot, clientName: 'Sophie Martin' })
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(shareId).toBeNull()
    expect(result.current.error).toBeTruthy()
  })
})
