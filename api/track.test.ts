import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { insertMock, rpcMock } = vi.hoisted(() => ({ insertMock: vi.fn(), rpcMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ insert: insertMock }), rpc: rpcMock }),
}))

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler, normalizePath } = await import('./track.js')

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
  res.end = vi.fn(() => res) as unknown as VercelResponse['end']
  return res
}

function mockReq(body: unknown, method = 'POST'): VercelRequest {
  return { method, headers: { 'x-forwarded-for': '203.0.113.1' }, body } as VercelRequest
}

describe('POST /api/track', () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    insertMock.mockReset().mockResolvedValue({ error: null })
  })

  it('refuse les méthodes autres que POST', async () => {
    const res = mockRes()
    await handler(mockReq({}, 'GET'), res)
    expect(res.statusCode).toBe(405)
  })

  it('enregistre un évènement autorisé, sans aucune donnée d’identité', async () => {
    const res = mockRes()
    await handler(mockReq({ name: 'CTA Click', path: '/?utm=x#haut', props: { location: 'hero' } }), res)
    expect(res.statusCode).toBe(204)
    expect(insertMock).toHaveBeenCalledWith({ name: 'CTA Click', path: '/', props: { location: 'hero' } })
  })

  it('accepte le corps en texte (navigator.sendBeacon)', async () => {
    const res = mockRes()
    await handler(mockReq(JSON.stringify({ name: 'pageview', path: '/inscription' })), res)
    expect(insertMock).toHaveBeenCalledWith({ name: 'pageview', path: '/inscription', props: {} })
  })

  it('ignore un nom d’évènement inconnu, un chemin invalide ou un JSON cassé', async () => {
    for (const body of [{ name: 'Hack', path: '/' }, { name: 'pageview', path: 'http://x' }, '{pas du json']) {
      const res = mockRes()
      await handler(mockReq(body), res)
      expect(res.statusCode).toBe(204)
    }
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('nettoie les propriétés : 5 maximum, clés simples, valeurs courtes', async () => {
    const res = mockRes()
    await handler(
      mockReq({
        name: 'Feature View',
        path: '/',
        props: { name: 'x'.repeat(200), 'Mauvaise Clé': 'a', seconds: 12.7, ok: true, obj: { a: 1 } },
      }),
      res,
    )
    expect(insertMock).toHaveBeenCalledWith({
      name: 'Feature View',
      path: '/',
      props: { name: 'x'.repeat(60), seconds: 13, ok: true },
    })
  })

  it('refuse au-delà de la limite de requêtes', async () => {
    rpcMock.mockReset().mockResolvedValue({ data: false, error: null })
    const res = mockRes()
    await handler(mockReq({ name: 'pageview', path: '/' }), res)
    expect(res.statusCode).toBe(429)
    expect(insertMock).not.toHaveBeenCalled()
  })
})

describe('normalizePath', () => {
  it('remplace les identifiants par :id et retire paramètres et ancre', () => {
    expect(normalizePath('/mariages/3f2a9c1e-1111-2222-3333-444455556666/plan-salle?x=1#a')).toBe('/mariages/:id/plan-salle')
    expect(normalizePath('/devis/AbCdEfGhIjKlMnOpQr')).toBe('/devis/:id')
    expect(normalizePath('/aujourdhui')).toBe('/aujourdhui')
    expect(normalizePath('pas-un-chemin')).toBeNull()
  })
})
