import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { getUserMock, rpcMock } = vi.hoisted(() => ({ getUserMock: vi.fn(), rpcMock: vi.fn() }))

function chain(result: unknown) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'gte', 'lt', 'order', 'limit', 'eq', 'delete']) c[m] = () => c
  c.range = () => Promise.resolve({ data: [], error: null })
  c.maybeSingle = () => Promise.resolve({ data: { redeemed_count: 4 }, error: null })
  c.then = (resolve: (v: unknown) => void) => resolve(result)
  return c
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => chain(table === 'users' ? { data: [], error: null } : { data: [], error: null }),
    rpc: rpcMock,
  }),
}))

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./kpis.js')

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
  res.setHeader = vi.fn(() => res) as unknown as VercelResponse['setHeader']
  return res
}

const req = (headers: Record<string, string> = {}, method = 'GET', query: Record<string, string> = {}) =>
  ({ method, query, headers: { 'x-forwarded-for': '203.0.113.1', ...headers } }) as unknown as VercelRequest

describe('GET /api/admin/kpis', () => {
  beforeEach(() => {
    rpcMock.mockReset().mockResolvedValue({ data: true, error: null })
    getUserMock.mockReset()
    delete process.env.ADMIN_EMAILS
  })

  it('refuse les méthodes autres que GET', async () => {
    const res = mockRes()
    await handler(req({}, 'POST'), res)
    expect(res.statusCode).toBe(405)
  })

  it('401 sans jeton', async () => {
    const res = mockRes()
    await handler(req(), res)
    expect(res.statusCode).toBe(401)
  })

  it('401 avec un jeton invalide', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('bad') })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer x' }), res)
    expect(res.statusCode).toBe(401)
  })

  it('403 pour une cliente connectée qui n’est pas administratrice', async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: 'cliente@example.com' } }, error: null })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer ok' }), res)
    expect(res.statusCode).toBe(403)
  })

  it('200 et indicateurs pour l’administratrice (insensible à la casse)', async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: 'CleliaDrouman@gmail.com' } }, error: null })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer ok' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ users: { total: 0, launchOffer: { redeemed: 4, limit: 100 } }, events: { totalEvents: 0 } })
  })

  it('?check=1 : répond seulement { admin: true } à l’administratrice, sans requête de données', async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: 'cleliadrouman@gmail.com' } }, error: null })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer ok' }, 'GET', { check: '1' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ admin: true })
  })

  it('?check=1 : 403 pour une cliente', async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: 'cliente@example.com' } }, error: null })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer ok' }, 'GET', { check: '1' }), res)
    expect(res.statusCode).toBe(403)
  })

  it('ADMIN_EMAILS remplace l’adresse par défaut', async () => {
    process.env.ADMIN_EMAILS = 'autre@example.com'
    getUserMock.mockResolvedValue({ data: { user: { email: 'cleliadrouman@gmail.com' } }, error: null })
    const res = mockRes()
    await handler(req({ authorization: 'Bearer ok' }), res)
    expect(res.statusCode).toBe(403)
  })
})
