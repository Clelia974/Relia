import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useShareFacture } from '@/features/invoices/useShareFacture'
import type { FactureSnapshot } from '@/features/invoices/factureSnapshot'

const getSessionMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: getSessionMock } } }))

const snapshot = { invoiceNumber: 'FAC-2026-0001' } as unknown as FactureSnapshot

beforeEach(() => {
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useShareFacture', () => {
  it('envoie le jeton de session courant et renvoie l’id partagé', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, shareId: 'share-abc' }) })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useShareFacture())

    let shareId: string | null = null
    await act(async () => {
      shareId = await result.current.shareFacture({ snapshot, clientEmail: 'sophie@example.com', clientName: 'Sophie Martin' })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/factures/share',
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Facture invalide.' }) }))

    const { result } = renderHook(() => useShareFacture())

    let shareId: string | null = 'not-null'
    await act(async () => {
      shareId = await result.current.shareFacture({ snapshot, clientName: 'Sophie Martin' })
    })

    expect(shareId).toBeNull()
    expect(result.current.error).toBe('Facture invalide.')
  })

  it('refuse sans session active, sans appeler le serveur', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useShareFacture())

    let shareId: string | null = 'not-null'
    await act(async () => {
      shareId = await result.current.shareFacture({ snapshot, clientName: 'Sophie Martin' })
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(shareId).toBeNull()
  })
})
