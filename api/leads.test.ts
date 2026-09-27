import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { rpcMock, maybeSingleMock, insertMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  insertMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: rpcMock,
    from: (table: string) => {
      if (table === 'users') return { select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }
      return { insert: insertMock }
    },
  }),
}))

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./leads.js')

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
  userId: 'decoratrice-1',
  clientName: 'Sophie Martin',
  clientPhone: '0692000000',
  clientEmail: 'sophie@example.com',
  eventType: 'mariage',
  eventDate: '2027-06-12',
  budgetEstimate: 5000,
  message: 'On cherche une déco champêtre.',
  source: 'instagram',
}

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.5' }, body: validBody, ...overrides } as VercelRequest
}

describe('POST /api/leads', () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    maybeSingleMock.mockReset().mockResolvedValue({ data: { id: 'decoratrice-1' }, error: null })
    insertMock.mockReset().mockResolvedValue({ error: null })
  })

  it('refuse les méthodes autres que POST', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('refuse au-delà de la limite de requêtes (rate limit), sans jamais toucher la base', async () => {
    rpcMock.mockReset().mockResolvedValue({ data: false, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(429)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('refuse un formulaire invalide (champ obligatoire manquant)', async () => {
    const res = mockRes()
    await handler(mockReq({ body: { ...validBody, clientName: '' } }), res)
    expect(res.statusCode).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("refuse si le lien ne correspond à aucune décoratrice existante (jamais de demande orpheline)", async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: null, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(404)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('crée la demande pour la décoratrice destinataire et renvoie ok', async () => {
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'decoratrice-1',
        client_name: 'Sophie Martin',
        event_type: 'mariage',
        source: 'instagram',
      }),
    )
  })

  it('renvoie 500 avec un message générique (jamais le détail interne) si l’insertion échoue', async () => {
    insertMock.mockReset().mockResolvedValue({ error: { message: 'Supabase indisponible' } })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })
})
