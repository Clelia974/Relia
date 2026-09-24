import { describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { maybeSingleMock } = vi.hoisted(() => ({ maybeSingleMock: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }) }),
}))

process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake'

const { default: handler } = await import('./launch-offer-count.js')

function mockRes() {
  const res = { statusCode: 0, body: undefined as unknown, headers: {} as Record<string, string> } as VercelResponse & {
    statusCode: number
    body: unknown
    headers: Record<string, string>
  }
  res.status = vi.fn((code: number) => {
    res.statusCode = code
    return res
  }) as unknown as VercelResponse['status']
  res.json = vi.fn((data: unknown) => {
    res.body = data
    return res
  }) as unknown as VercelResponse['json']
  res.setHeader = vi.fn((key: string, value: string) => {
    res.headers[key] = value
    return res
  }) as unknown as VercelResponse['setHeader']
  return res
}

describe('GET /api/launch-offer-count', () => {
  it('refuse les méthodes autres que GET', async () => {
    const res = mockRes()
    await handler({ method: 'POST' } as VercelRequest, res)
    expect(res.statusCode).toBe(405)
  })

  it('renvoie le nombre de places restantes, lu depuis le compteur atomique (jamais un count(*) séparé)', async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 37 }, error: null })
    const res = mockRes()

    await handler({ method: 'GET' } as VercelRequest, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ limit: 100, redeemed: 37, remaining: 63, available: true })
  })

  it('offre épuisée : remaining à 0, available à false, jamais négatif', async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: { redeemed_count: 130 }, error: null })
    const res = mockRes()

    await handler({ method: 'GET' } as VercelRequest, res)

    expect(res.body).toEqual({ limit: 100, redeemed: 130, remaining: 0, available: false })
  })

  it('renvoie 500 avec un message générique (jamais le détail interne) si Supabase échoue', async () => {
    maybeSingleMock.mockReset().mockResolvedValue({ data: null, error: { message: 'Supabase indisponible' } })
    const res = mockRes()

    await handler({ method: 'GET' } as VercelRequest, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Erreur interne.' })
  })
})
