import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { constructEventMock, updateMock, eqUpdateMock, maybeSingleMock, eqSelectMock, fromMock, rpcMock } = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const eqSelectMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqSelectMock }))
  const eqUpdateMock = vi.fn()
  const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))
  const fromMock = vi.fn(() => ({ select: selectMock, update: updateMock }))
  return {
    constructEventMock: vi.fn(),
    updateMock,
    eqUpdateMock,
    maybeSingleMock,
    eqSelectMock,
    fromMock,
    rpcMock: vi.fn(),
  }
})

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEvent: constructEventMock }
  },
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ from: fromMock, rpc: rpcMock })) }))

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake'
process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_fake'

const { default: handler } = await import('./webhook')

/**
 * Pas de valeur par défaut pour `signature` : un paramètre explicitement
 * passé à `undefined` réactiverait quand même une valeur par défaut en JS
 * (piège des default parameters), ce qui masquerait silencieusement le
 * cas "signature absente" que plusieurs tests ci-dessous veulent exercer.
 */
function mockReq(body: string, signature: string | undefined): VercelRequest {
  const chunks = [Buffer.from(body)]
  return {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    [Symbol.asyncIterator]: () => chunks[Symbol.iterator](),
  } as unknown as VercelRequest
}

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

beforeEach(() => {
  constructEventMock.mockReset()
  updateMock.mockClear()
  eqUpdateMock.mockReset().mockResolvedValue({ error: null })
  maybeSingleMock.mockReset()
  fromMock.mockClear()
  // Par défaut, la place est accordée (compteur < 100) — les tests qui veulent l'offre épuisée le redéfinissent.
  rpcMock.mockReset().mockResolvedValue({ data: 1, error: null })
})

describe('POST /api/stripe/webhook', () => {
  it('refuse les méthodes autres que POST', async () => {
    const res = mockRes()
    await handler({ method: 'GET' } as VercelRequest, res)
    expect(res.statusCode).toBe(405)
  })

  it('refuse une requête sans signature', async () => {
    const res = mockRes()
    await handler(mockReq('{}', undefined), res)
    expect(res.statusCode).toBe(400)
  })

  it('refuse une signature invalide sans toucher à la base', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('signature invalide')
    })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(400)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('checkout.session.completed : active l’abonnement et enregistre le customer Stripe', async () => {
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'u1', customer: 'cus_123' } },
    })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(fromMock).toHaveBeenCalledWith('users')
    expect(rpcMock).not.toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalledWith({ subscription_status: 'active', stripe_customer_id: 'cus_123', is_launch_offer: false })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'u1')
  })

  it("checkout.session.completed avec metadata.offer = launch_100 : marque is_launch_offer (compté par l'offre de lancement)", async () => {
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'u1', customer: 'cus_123', metadata: { offer: 'launch_100' } } },
    })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('claim_launch_offer_slot')
    expect(updateMock).toHaveBeenCalledWith({ subscription_status: 'active', stripe_customer_id: 'cus_123', is_launch_offer: true })
  })

  it("offre de lancement déjà à 100 places (claim_launch_offer_slot ne renvoie aucune ligne) : active quand même l'abonnement déjà payé, mais ne le compte pas", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'u1', customer: 'cus_123', metadata: { offer: 'launch_100' } } },
    })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ subscription_status: 'active', stripe_customer_id: 'cus_123', is_launch_offer: false })
  })

  it("claim_launch_offer_slot est appelée pour chaque webhook simultané : jamais plus de 100 réussites même sous concurrence (garanti par l'UPDATE atomique en base, pas par ce test — vérifié ici juste que l'appel a bien lieu par événement)", async () => {
    constructEventMock.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { client_reference_id: 'u1', customer: 'cus_123', metadata: { offer: 'launch_100' } } },
    })
    const res1 = mockRes()
    const res2 = mockRes()

    await Promise.all([handler(mockReq('{}', 'sig_valide'), res1), handler(mockReq('{}', 'sig_valide'), res2)])

    expect(rpcMock).toHaveBeenCalledTimes(2)
  })

  it('customer.subscription.deleted : retrouve l’utilisateur via stripe_customer_id (pas client_reference_id, absent sur cet objet)', async () => {
    constructEventMock.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_123' } },
    })
    maybeSingleMock.mockResolvedValue({ data: { id: 'u1' }, error: null })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(eqSelectMock).toHaveBeenCalledWith('stripe_customer_id', 'cus_123')
    expect(updateMock).toHaveBeenCalledWith({ subscription_status: 'cancelled' })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'u1')
  })

  it('customer.subscription.deleted sans utilisateur trouvé : ne touche pas la base, répond quand même 200', async () => {
    constructEventMock.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_inconnu' } },
    })
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('événement non géré : répond 200 sans toucher à la base', async () => {
    constructEventMock.mockReturnValue({ type: 'invoice.paid', data: { object: {} } })
    const res = mockRes()

    await handler(mockReq('{}', 'sig_valide'), res)

    expect(res.statusCode).toBe(200)
    expect(fromMock).not.toHaveBeenCalled()
  })
})
