import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { createPortalSessionMock, getUserMock, singleMock } = vi.hoisted(() => ({
  createPortalSessionMock: vi.fn(),
  getUserMock: vi.fn(),
  singleMock: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class {
    billingPortal = { sessions: { create: createPortalSessionMock } }
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: singleMock }) }) }),
  }),
}))

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./portal-session.js')

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
  return { method: 'POST', headers: {}, ...overrides } as VercelRequest
}

describe('POST /api/stripe/portal-session', () => {
  it('refuse les méthodes autres que POST', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it("refuse une requête sans jeton d'accès", async () => {
    const res = mockRes()
    await handler(mockReq({ headers: {} }), res)
    expect(res.statusCode).toBe(401)
    expect(createPortalSessionMock).not.toHaveBeenCalled()
  })

  it("refuse un jeton d'accès invalide, sans jamais faire confiance à un userId fourni par le client", async () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: null }, error: new Error('invalid token') })
    const res = mockRes()
    await handler(mockReq({ headers: { authorization: 'Bearer faux-jeton' } }), res)
    expect(res.statusCode).toBe(401)
    expect(createPortalSessionMock).not.toHaveBeenCalled()
  })

  it("refuse si le compte n'a jamais eu d'abonnement Stripe (pas de stripe_customer_id)", async () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    singleMock.mockReset().mockResolvedValue({ data: { stripe_customer_id: null }, error: null })
    const res = mockRes()

    await handler(mockReq({ headers: { authorization: 'Bearer bon-jeton' } }), res)

    expect(res.statusCode).toBe(400)
    expect(createPortalSessionMock).not.toHaveBeenCalled()
  })

  it('crée la session de portail pour le client Stripe du compte authentifié et renvoie son URL', async () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    singleMock.mockReset().mockResolvedValue({ data: { stripe_customer_id: 'cus_abc123' }, error: null })
    createPortalSessionMock.mockReset().mockResolvedValue({ url: 'https://billing.stripe.com/session-xyz' })
    const res = mockRes()

    await handler(mockReq({ headers: { authorization: 'Bearer bon-jeton' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ url: 'https://billing.stripe.com/session-xyz' })
    expect(createPortalSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_abc123' }),
    )
  })

  it('renvoie 500 avec un message générique (jamais le détail interne) si Stripe échoue', async () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    singleMock.mockReset().mockResolvedValue({ data: { stripe_customer_id: 'cus_abc123' }, error: null })
    createPortalSessionMock.mockReset().mockImplementation(async () => {
      throw new Error('Stripe indisponible')
    })
    const res = mockRes()

    await handler(mockReq({ headers: { authorization: 'Bearer bon-jeton' } }), res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })
})
