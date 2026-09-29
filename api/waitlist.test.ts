import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { rpcMock, upsertMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  upsertMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: rpcMock,
    from: () => ({ upsert: upsertMock }),
  }),
}))

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./waitlist.js')

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
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.5' },
    body: { email: 'sophie@example.com' },
    ...overrides,
  } as VercelRequest
}

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    upsertMock.mockReset().mockResolvedValue({ error: null })
  })

  it('refuse les méthodes autres que POST', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('refuse au-delà de la limite de requêtes, sans jamais toucher la base', async () => {
    rpcMock.mockReset().mockResolvedValue({ data: false, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(429)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('refuse une adresse email invalide', async () => {
    const res = mockRes()
    await handler(mockReq({ body: { email: 'pas-un-email' } }), res)
    expect(res.statusCode).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('inscrit l’adresse (normalisée en minuscules) et renvoie ok', async () => {
    const res = mockRes()
    await handler(mockReq({ body: { email: 'Sophie@Example.com' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(upsertMock).toHaveBeenCalledWith(
      { email: 'sophie@example.com', source: 'zordi_landing' },
      { onConflict: 'email', ignoreDuplicates: true },
    )
  })

  it('ne révèle jamais un doublon — répond ok même si déjà inscrite', async () => {
    const res = mockRes()
    await handler(mockReq(), res)
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('renvoie 500 avec un message générique si l’insertion échoue', async () => {
    upsertMock.mockReset().mockResolvedValue({ error: { message: 'Supabase indisponible' } })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })
})
