import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNewLeads, markLeadStatus } from '@/features/leads/leadsApi'

const { orderMock, eqSelectMock, selectMock, eqUpdateMock, updateMock, fromMock } = vi.hoisted(() => {
  const orderMock = vi.fn()
  const eqSelectMock = vi.fn(() => ({ order: orderMock }))
  const selectMock = vi.fn(() => ({ eq: eqSelectMock }))
  const eqUpdateMock = vi.fn()
  const updateMock = vi.fn(() => ({ eq: eqUpdateMock }))
  const fromMock = vi.fn(() => ({ select: selectMock, update: updateMock }))
  return { orderMock, eqSelectMock, selectMock, eqUpdateMock, updateMock, fromMock }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

beforeEach(() => {
  fromMock.mockClear()
  selectMock.mockClear()
  eqSelectMock.mockClear()
  orderMock.mockReset()
  updateMock.mockClear()
  eqUpdateMock.mockReset()
})

const validRow = {
  id: 'lead-1',
  user_id: 'u1',
  client_name: 'Sophie',
  client_phone: null,
  client_email: null,
  event_type: 'mariage',
  event_date: '2027-06-12',
  budget_estimate: null,
  message: null,
  source: 'instagram',
  status: 'nouveau',
  created_at: '2026-09-20T10:00:00.000Z',
}

describe('fetchNewLeads', () => {
  it('ne lit que les demandes au statut "nouveau", triées par date décroissante — RLS restreint déjà au propriétaire', async () => {
    orderMock.mockResolvedValue({ data: [validRow], error: null })

    const result = await fetchNewLeads()

    expect(fromMock).toHaveBeenCalledWith('leads')
    expect(eqSelectMock).toHaveBeenCalledWith('status', 'nouveau')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([validRow])
  })

  it('propage une erreur Supabase', async () => {
    orderMock.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })
    await expect(fetchNewLeads()).rejects.toEqual({ message: 'RLS violation' })
  })

  it('rejette une ligne qui ne correspond pas au schéma attendu — jamais de confiance aveugle dans les données lues', async () => {
    orderMock.mockResolvedValue({ data: [{ ...validRow, event_type: 'pas-un-type-valide' }], error: null })
    await expect(fetchNewLeads()).rejects.toThrow()
  })
})

describe('markLeadStatus', () => {
  it('met à jour le statut de la demande ciblée', async () => {
    eqUpdateMock.mockResolvedValue({ error: null })

    await markLeadStatus('lead-1', 'importe')

    expect(fromMock).toHaveBeenCalledWith('leads')
    expect(updateMock).toHaveBeenCalledWith({ status: 'importe' })
    expect(eqUpdateMock).toHaveBeenCalledWith('id', 'lead-1')
  })

  it('propage une erreur Supabase', async () => {
    eqUpdateMock.mockResolvedValue({ error: { message: 'Network error' } })
    await expect(markLeadStatus('lead-1', 'ignore')).rejects.toEqual({ message: 'Network error' })
  })
})
