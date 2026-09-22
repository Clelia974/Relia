import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { createSessionMock } = vi.hoisted(() => ({ createSessionMock: vi.fn() }))
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: createSessionMock } }
  },
}))

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.VITE_STRIPE_PRICE_SOLO_MONTHLY = 'price_month_123'
process.env.VITE_STRIPE_PRICE_SOLO_YEARLY = 'price_year_456'

const { default: handler } = await import('./checkout-session')

function mockRes() {
  const res = { statusCode: 0, body: undefined as unknown } as VercelResponse & { statusCode: number; body: unknown }
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  }) as unknown as VercelResponse['status']
  res.json = vi.fn((data: unknown) => {
    res.body = data
    return res
  }) as unknown as VercelResponse['json']
  return res
}

/**
 * Pas de beforeEach ici (délibérément) : un beforeEach dans ce fichier
 * précis fait déclencher à Vitest un faux "unhandled rejection" sur le
 * test qui fait échouer createSessionMock — reproduit même avec
 * beforeEach(() => createSessionMock.mockClear()), donc pas lié à
 * mockReset() en particulier. Le comportement réel (vérifié hors Vitest,
 * en Node pur) est correct : l'erreur est bien attrapée par le try/catch
 * du handler. Contournement : reset explicite en début de chaque test.
 */
describe('POST /api/stripe/checkout-session', () => {
  it('refuse les méthodes autres que POST', async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler({ method: 'GET' } as VercelRequest, res)
    expect(res.statusCode).toBe(405)
  })

  it('refuse un priceId hors liste blanche (jamais confiance dans le client)', async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler(
      { method: 'POST', body: { priceId: 'price_arbitraire', userId: 'u1', userEmail: 'sophie@example.com' } } as VercelRequest,
      res,
    )
    expect(res.statusCode).toBe(400)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('refuse des champs manquants', async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler({ method: 'POST', body: { priceId: 'price_month_123' } } as VercelRequest, res)
    expect(res.statusCode).toBe(400)
  })

  it('crée la session et renvoie son URL pour un priceId valide', async () => {
    createSessionMock.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/session-abc' })
    const res = mockRes()

    await handler(
      { method: 'POST', body: { priceId: 'price_month_123', userId: 'u1', userEmail: 'sophie@example.com' } } as VercelRequest,
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ url: 'https://checkout.stripe.com/session-abc' })
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        client_reference_id: 'u1',
        customer_email: 'sophie@example.com',
        line_items: [{ price: 'price_month_123', quantity: 1 }],
      }),
    )
  })

  it('renvoie 500 avec un message lisible si Stripe échoue', async () => {
    createSessionMock.mockReset().mockImplementation(async () => {
      throw new Error('Stripe indisponible')
    })
    const res = mockRes()

    await handler(
      { method: 'POST', body: { priceId: 'price_month_123', userId: 'u1', userEmail: 'sophie@example.com' } } as VercelRequest,
      res,
    )

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Stripe indisponible' })
  })
})
