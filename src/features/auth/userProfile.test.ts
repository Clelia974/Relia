import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOwnUserProfile } from '@/features/auth/userProfile'

const { maybeSingleMock, eqMock, selectMock, fromMock } = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock = vi.fn(() => ({ select: selectMock }))
  return { maybeSingleMock, eqMock, selectMock, fromMock }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

beforeEach(() => {
  fromMock.mockClear()
  selectMock.mockClear()
  eqMock.mockClear()
  maybeSingleMock.mockReset()
})

describe('fetchOwnUserProfile', () => {
  it('convertit les colonnes snake_case de public.users en UserProfile camelCase', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'u1',
        email: 'sophie@example.com',
        trial_end_date: '2026-10-06T00:00:00.000Z',
        subscription_status: 'trial',
        created_at: '2026-09-22T00:00:00.000Z',
        updated_at: '2026-09-22T00:00:00.000Z',
      },
      error: null,
    })

    const profile = await fetchOwnUserProfile('u1')

    expect(fromMock).toHaveBeenCalledWith('users')
    expect(eqMock).toHaveBeenCalledWith('id', 'u1')
    expect(profile).toEqual({
      id: 'u1',
      email: 'sophie@example.com',
      trialEndDate: '2026-10-06T00:00:00.000Z',
      subscriptionStatus: 'trial',
      createdAt: '2026-09-22T00:00:00.000Z',
      updatedAt: '2026-09-22T00:00:00.000Z',
    })
  })

  it('renvoie null quand la ligne est absente (pas une erreur)', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })

    expect(await fetchOwnUserProfile('u1')).toBeNull()
  })

  it('propage une erreur Supabase', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'RLS violation' } })

    await expect(fetchOwnUserProfile('u1')).rejects.toEqual({ message: 'RLS violation' })
  })
})
