import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStripeCustomerPortal } from '@/features/payment/useStripeCustomerPortal'

const getSessionMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: getSessionMock } } }))

const originalLocation = window.location

beforeEach(() => {
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } })
  // window.location.href = ... n'est pas navigable dans jsdom sans stub — on remplace l'objet entier (même convention que useStripeCheckout.test.ts).
  Object.defineProperty(window, 'location', { value: { ...originalLocation, href: '' }, writable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
})

describe('useStripeCustomerPortal', () => {
  it('envoie le jeton de session courant et redirige vers le portail Stripe', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/session-xyz' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStripeCustomerPortal())

    await act(() => result.current.openCustomerPortal())

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/stripe/portal-session',
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer token-abc' } }),
    )
    expect(window.location.href).toBe('https://billing.stripe.com/session-xyz')
  })

  it('expose une erreur lisible si le serveur refuse', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Aucun abonnement Stripe associé.' }) }),
    )

    const { result } = renderHook(() => useStripeCustomerPortal())

    await act(() => result.current.openCustomerPortal())

    expect(result.current.error).toBe('Aucun abonnement Stripe associé.')
    expect(result.current.isLoading).toBe(false)
    expect(window.location.href).toBe('')
  })

  it('refuse sans session active, sans appeler le serveur', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStripeCustomerPortal())

    await act(() => result.current.openCustomerPortal())

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })
})
