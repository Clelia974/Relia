import { beforeEach, describe, expect, it, vi } from 'vitest'
import { countNewLeads, fetchActiveLeads, markLeadStatus } from '@/features/leads/leadsApi'

const { orderMock, inSelectMock, selectMock, eqUpdateMock, updateMock, eqCountMock, fromMock } = vi.hoisted(() => {
  const orderMock = vi.fn()
  const inSelectMock = vi.fn(() => ({ order: orderMock }))
  const eqCountMock = vi.fn()
  const selectMock = vi.fn((_columns?: string, _opts?: unknown) => ({ in: inSelectMock, eq: eqCountMock }))
  const eqUpdateMock = vi.fn()
  const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))
  const fromMock = vi.fn(() => ({ select: selectMock, update: updateMock }))
  return { orderMock, inSelectMock, selectMock, eqUpdateMock, updateMock, eqCountMock, fromMock }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

beforeEach(() => {
  fromMock.mockClear()
  selectMock.mockClear()
  inSelectMock.mockClear()
  orderMock.mockReset()
  updateMock.mockClear()
  eqUpdateMock.mockReset()
  eqCountMock.mockReset()
})

const validRow = {
  id: 'lead-1',
  user_id: 'u1',
  client_name: 'Sophie',
  client_phone: null,
  client_email: null,
  event_type: 'mariage',
  event_date: '2027-06-12',
  venue: null,
  guest_count: null,
  budget_estimate: null,
  message: null,
  source: 'instagram',
  status: 'nouveau',
  created_at: '2026-09-20T10:00:00.000Z',
}

describe('fetchActiveLeads', () => {
  it('ne lit que les demandes actives (pas signées ni écartées), triées par date décroissante — RLS restreint déjà au propriétaire', async () => {
    orderMock.mockResolvedValue({ data: [validRow], error: null })

    const result = await fetchActiveLeads()

    expect(fromMock).toHaveBeenCalledWith('leads')
    expect(inSelectMock).toHaveBeenCalledWith('status', ['nouveau', 'repondu', 'en_attente_reponse', 'devis_envoye'])
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([validRow])
  })

  it('propage une erreur Supabase', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })
    await expect(fetchActiveLeads()).rejects.toEqual({ message: 'RLS violation' })
  })

  it('rejette une ligne qui ne correspond pas au schéma attendu — jamais de confiance aveugle dans les données lues', async () => {
    orderMock.mockResolvedValue({ data: [{ ...validRow, event_type: 'pas-un-type-valide' }], error: null })
    await expect(fetchActiveLeads()).rejects.toThrow()
  })
})

describe('markLeadStatus', () => {
  it('met à jour le statut de la demande ciblée', async () => {
    eqUpdateMock.mockResolvedValue({ error: null })

    await markLeadStatus('lead-1', 'devis_envoye')

    expect(fromMock).toHaveBeenCalledWith('leads')
    expect(updateMock).toHaveBeenCalledWith({ status: 'devis_envoye' })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'lead-1')
  })

  it('propage une erreur Supabase', async () => {
    eqUpdateMock.mockResolvedValue({ error: { message: 'Network error' } })
    await expect(markLeadStatus('lead-1', 'ignore')).rejects.toEqual({ message: 'Network error' })
  })
})

describe('countNewLeads', () => {
  it('ne compte que les demandes "nouveau" — jamais celles déjà en négociation', async () => {
    eqCountMock.mockResolvedValue({ count: 3, error: null })

    const result = await countNewLeads()

    expect(eqCountMock).toHaveBeenCalledWith('status', 'nouveau')
    expect(result).toBe(3)
  })

  it('renvoie 0 (jamais null) quand count est absent', async () => {
    eqCountMock.mockResolvedValue({ count: null, error: null })
    expect(await countNewLeads()).toBe(0)
  })

  it('propage une erreur Supabase', async () => {
    eqCountMock.mockResolvedValue({ count: null, error: { message: 'RLS violation' } })
    await expect(countNewLeads()).rejects.toEqual({ message: 'RLS violation' })
  })
})
