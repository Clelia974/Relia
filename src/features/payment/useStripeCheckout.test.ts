import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStripeCheckout } from '@/features/payment/useStripeCheckout'

const getSessionMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: getSessionMock } } }))

const originalLocation = window.location

beforeEach(() => {
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } })
  // window.location.href = ... n'est pas navigable dans jsdom sans stub — on remplace l'objet entier.
  Object.defineProperty(window, 'location', { value: { ...originalLocation, href: '' }, writable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
})

describe('useStripeCheckout', () => {
  it('envoie le jeton de session courant (jamais un userId/userEmail affirmé par le client) puis redirige vers Stripe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/session-123' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStripeCheckout())

    await act(() => result.current.createCheckoutSession('price_test_123'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/stripe/checkout-session',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-abc' },
        body: JSON.stringify({ priceId: 'price_test_123' }),
      }),
    )
    expect(window.location.href).toBe('https://checkout.stripe.com/session-123')
  })

  it('expose une erreur lisible si le serveur refuse', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Offre inconnue.' }) }),
    )

    const { result } = renderHook(() => useStripeCheckout())

    await act(() => result.current.createCheckoutSession('price_invalide'))

    expect(result.current.error).toBe('Offre inconnue.')
    expect(result.current.isLoading).toBe(false)
    expect(window.location.href).toBe('')
  })

  it('refuse sans session active, sans appeler le serveur', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStripeCheckout())

    await act(() => result.current.createCheckoutSession('price_test_123'))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })
})
