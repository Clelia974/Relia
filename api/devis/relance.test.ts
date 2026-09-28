import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { getUserMock, rpcMock, maybeSingleMock, fetchMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }),
  }),
}))

vi.stubGlobal('fetch', fetchMock)

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./relance.js')

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

const validBody = {
  shareId: 'share-abc',
  clientEmail: 'sophie@example.com',
  clientName: 'Sophie Martin',
  companyName: 'Atelier Fleur de Lien',
}

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', headers: { authorization: 'Bearer bon-jeton' }, body: validBody, ...overrides } as VercelRequest
}

describe('POST /api/devis/relance', () => {
  const resetAll = () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    maybeSingleMock.mockReset().mockResolvedValue({ data: { user_id: 'u1' }, error: null })
    fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => '' })
    process.env.BREVO_API_KEY = 'brevo-fake-key'
  }

  it('refuse les méthodes autres que POST', async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it("refuse une requête sans jeton d'accès", async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq({ headers: {} }), res)
    expect(res.statusCode).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuse au-delà de la limite de requêtes', async () => {
    resetAll()
    rpcMock.mockReset().mockResolvedValue({ data: false, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(429)
  })

  it('refuse si le devis partagé est introuvable', async () => {
    resetAll()
    maybeSingleMock.mockReset().mockResolvedValue({ data: null, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("refuse de relancer le devis d'une autre décoratrice", async () => {
    resetAll()
    maybeSingleMock.mockReset().mockResolvedValue({ data: { user_id: 'autre-user' }, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("envoie l'email de relance avec le nom de la décoratrice quand tout est valide", async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.sender).toEqual({ name: 'Atelier Fleur de Lien', email: 'contact@evenementscles.com' })
    expect(body.htmlContent).toContain('/devis/share-abc')
  })

  it('renvoie ok:false (jamais une erreur 500) si Brevo échoue — la relance interne reste déjà faite côté client', async () => {
    resetAll()
    fetchMock.mockReset().mockResolvedValue({ ok: false, status: 500, text: async () => 'erreur' })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: false })
  })
})
