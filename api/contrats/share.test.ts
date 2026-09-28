import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { getUserMock, rpcMock, insertMock, singleMock, selectAfterInsertMock, fetchMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  insertMock: vi.fn(),
  singleMock: vi.fn(),
  selectAfterInsertMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
    from: () => ({ insert: insertMock }),
  }),
}))

vi.stubGlobal('fetch', fetchMock)

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./share.js')

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
  storagePath: 'u1/uuid-contrat.pdf',
  fileName: 'contrat.pdf',
  clientEmail: 'sophie@example.com',
  clientName: 'Sophie Martin',
  companyName: 'Atelier Fleur de Lien',
  replyToEmail: 'contact@atelierfleurdelien.fr',
}

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', headers: { authorization: 'Bearer bon-jeton' }, body: validBody, ...overrides } as VercelRequest
}

describe('POST /api/contrats/share', () => {
  const resetAll = () => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    selectAfterInsertMock.mockReset().mockReturnValue({ single: singleMock })
    singleMock.mockReset().mockResolvedValue({ data: { id: 'share-abc' }, error: null })
    insertMock.mockReset().mockReturnValue({ select: selectAfterInsertMock })
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
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('refuse au-delà de la limite de requêtes (rate limit)', async () => {
    resetAll()
    rpcMock.mockReset().mockResolvedValue({ data: false, error: null })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(429)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('refuse un corps invalide (storagePath manquant)', async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq({ body: { ...validBody, storagePath: '' } }), res)
    expect(res.statusCode).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("refuse un fichier hors du dossier de l'utilisatrice authentifiée (jamais le fichier d'une autre décoratrice)", async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq({ body: { ...validBody, storagePath: 'autre-user/uuid-contrat.pdf' } }), res)
    expect(res.statusCode).toBe(403)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it("enregistre le partage et renvoie l'id, avec un email Brevo personnalisé", async () => {
    resetAll()
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, shareId: 'share-abc' })
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', client_email: 'sophie@example.com', storage_path: 'u1/uuid-contrat.pdf', file_name: 'contrat.pdf' }),
    )
    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.sender).toEqual({ name: 'Atelier Fleur de Lien', email: 'contact@evenementscles.com' })
  })

  it('renvoie 500 avec un message générique si l’insertion échoue', async () => {
    resetAll()
    singleMock.mockReset().mockResolvedValue({ data: null, error: { message: 'Supabase indisponible' } })
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })

  it('réussit même si l’envoi Brevo échoue (best-effort, jamais bloquant)', async () => {
    resetAll()
    fetchMock.mockReset().mockRejectedValue(new Error('Brevo indisponible'))
    const res = mockRes()
    await handler(mockReq(), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, shareId: 'share-abc' })
  })
})
