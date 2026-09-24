import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { createSessionMock, maybeSingleMock, getUserMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  getUserMock: vi.fn(),
}))
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: createSessionMock } }
  },
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }),
  }),
}))

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'
process.env.VITE_STRIPE_PRICE_SOLO_MONTHLY = 'price_month_123'
process.env.VITE_STRIPE_PRICE_SOLO_YEARLY = 'price_year_456'
process.env.VITE_STRIPE_PRICE_LAUNCH_OFFER = 'price_launch_789'
process.env.VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL = 'price_launch_annual_987'

// Par défaut, "0 place prise" — la plupart des tests ne concernent pas l'offre de lancement.
maybeSingleMock.mockResolvedValue({ data: { redeemed_count: 0 }, error: null })
// Par défaut, jeton valide pour "sophie@example.com" (u1) — les tests qui veulent un jeton invalide le remplacent explicitement.
getUserMock.mockResolvedValue({ data: { user: { id: 'u1', email: 'sophie@example.com' } }, error: null })

const { default: handler } = await import('./checkout-session.js')

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

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', headers: { authorization: 'Bearer bon-jeton' }, ...overrides } as VercelRequest
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
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it("refuse une requête sans jeton d'accès", async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler(mockReq({ headers: {} }), res)
    expect(res.statusCode).toBe(401)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it("refuse un jeton d'accès invalide, sans jamais faire confiance à un userId/userEmail fourni par le client", async () => {
    createSessionMock.mockReset()
    getUserMock.mockReset().mockResolvedValue({ data: { user: null }, error: new Error('invalid token') })
    const res = mockRes()
    await handler(
      mockReq({ headers: { authorization: 'Bearer faux-jeton' }, body: { priceId: 'price_month_123' } }),
      res,
    )
    expect(res.statusCode).toBe(401)
    expect(createSessionMock).not.toHaveBeenCalled()
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1', email: 'sophie@example.com' } }, error: null })
  })

  it('refuse un priceId hors liste blanche (jamais confiance dans le client)', async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler(mockReq({ body: { priceId: 'price_arbitraire' } }), res)
    expect(res.statusCode).toBe(400)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it('refuse des champs manquants', async () => {
    createSessionMock.mockReset()
    const res = mockRes()
    await handler(mockReq({ body: {} }), res)
    expect(res.statusCode).toBe(400)
  })

  it("crée la session pour l'utilisateur authentifié (identité tirée du jeton, pas du corps de la requête) et renvoie son URL", async () => {
    createSessionMock.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/session-abc' })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_month_123' } }), res)

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

  it("crée la session de l'offre de lancement avec le mois offert (trial_period_days) et le tag de metadata, tant qu'il reste des places", async () => {
    createSessionMock.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/session-launch' })
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 42 }, error: null })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_launch_789' } }), res)

    expect(res.statusCode).toBe(200)
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_launch_789', quantity: 1 }],
        subscription_data: { trial_period_days: 30 },
        metadata: { offer: 'launch_100' },
      }),
    )
  })

  it("crée aussi la session de l'offre de lancement pour le price annuel dédié, même mois offert et même metadata", async () => {
    createSessionMock.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/session-launch-annual' })
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 10 }, error: null })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_launch_annual_987' } }), res)

    expect(res.statusCode).toBe(200)
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_launch_annual_987', quantity: 1 }],
        subscription_data: { trial_period_days: 30 },
        metadata: { offer: 'launch_100' },
      }),
    )
  })

  it("refuse aussi le price annuel de l'offre une fois les 100 places prises (même compteur que le mensuel)", async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 100 }, error: null })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_launch_annual_987' } }), res)

    expect(res.statusCode).toBe(400)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it("refuse l'offre de lancement une fois les 100 places prises, sans jamais créer de session", async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 100 }, error: null })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_launch_789' } }), res)

    expect(res.statusCode).toBe(400)
    expect(createSessionMock).not.toHaveBeenCalled()
  })

  it("un priceId standard (mensuel/annuel) ne déclenche jamais le mois offert ni le comptage de l'offre de lancement", async () => {
    createSessionMock.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/session-abc' })
    maybeSingleMock.mockReset()
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_month_123' } }), res)

    expect(res.statusCode).toBe(200)
    expect(maybeSingleMock).not.toHaveBeenCalled()
    expect(createSessionMock).toHaveBeenCalledWith(expect.not.objectContaining({ subscription_data: expect.anything() }))
  })

  it('renvoie 500 avec un message générique (jamais le détail interne) si Stripe échoue', async () => {
    createSessionMock.mockReset().mockImplementation(async () => {
      throw new Error('Stripe indisponible')
    })
    const res = mockRes()

    await handler(mockReq({ body: { priceId: 'price_month_123' } }), res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })
})
