import { describe, expect, it } from 'vitest'
import { canCreateWedding, GRATUIT_WEDDING_LIMIT, isWeddingCreationUnlimited } from '@/features/payment/weddingLimit'

describe('isWeddingCreationUnlimited', () => {
  it('illimité pour trial, grace, active et statut non résolu (undefined)', () => {
    expect(isWeddingCreationUnlimited('trial')).toBe(true)
    expect(isWeddingCreationUnlimited('grace')).toBe(true)
    expect(isWeddingCreationUnlimited('active')).toBe(true)
    expect(isWeddingCreationUnlimited(undefined)).toBe(true)
  })

  it('limité pour expired (Version Gratuite) et cancelled', () => {
    expect(isWeddingCreationUnlimited('expired')).toBe(false)
    expect(isWeddingCreationUnlimited('cancelled')).toBe(false)
  })
})

describe('canCreateWedding', () => {
  it('trial : toujours autorisé, même très au-delà de la limite', () => {
    expect(canCreateWedding('trial', 100)).toBe(true)
  })

  it('active (Pro) : toujours autorisé', () => {
    expect(canCreateWedding('active', 100)).toBe(true)
  })

  it(`expired (Gratuit) : autorisé sous la limite (${GRATUIT_WEDDING_LIMIT})`, () => {
    expect(canCreateWedding('expired', 0)).toBe(true)
    expect(canCreateWedding('expired', GRATUIT_WEDDING_LIMIT - 1)).toBe(true)
  })

  it('expired (Gratuit) : bloqué à la limite et au-delà', () => {
    expect(canCreateWedding('expired', GRATUIT_WEDDING_LIMIT)).toBe(false)
    expect(canCreateWedding('expired', GRATUIT_WEDDING_LIMIT + 5)).toBe(false)
  })

  it('cancelled : même limite que expired', () => {
    expect(canCreateWedding('cancelled', GRATUIT_WEDDING_LIMIT - 1)).toBe(true)
    expect(canCreateWedding('cancelled', GRATUIT_WEDDING_LIMIT)).toBe(false)
  })
})
