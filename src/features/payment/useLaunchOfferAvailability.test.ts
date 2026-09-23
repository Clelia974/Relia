import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLaunchOfferAvailability } from '@/features/payment/useLaunchOfferAvailability'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLaunchOfferAvailability', () => {
  it("lit le nombre réel de places depuis l'API, jamais un chiffre codé en dur", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ limit: 100, redeemed: 12, remaining: 88, available: true }) }),
    )

    const { result } = renderHook(() => useLaunchOfferAvailability())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.offer).toEqual({ limit: 100, redeemed: 12, remaining: 88, available: true })
  })

  it("laisse l'offre à null si le serveur échoue, plutôt que d'afficher une place disponible par défaut", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Erreur' }) }))

    const { result } = renderHook(() => useLaunchOfferAvailability())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.offer).toBeNull()
  })

  it('laisse l’offre à null sur une erreur réseau, sans planter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const { result } = renderHook(() => useLaunchOfferAvailability())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.offer).toBeNull()
  })
})
