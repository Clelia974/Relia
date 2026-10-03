import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasOptedOut, isTrackingAllowed, setOptedOut, track } from '@/lib/analytics'

afterEach(() => {
  setOptedOut(false)
  vi.restoreAllMocks()
})

describe('analytics', () => {
  it('« Ne pas me compter » est mémorisé puis retiré', () => {
    expect(hasOptedOut()).toBe(false)
    setOptedOut(true)
    expect(hasOptedOut()).toBe(true)
    setOptedOut(false)
    expect(hasOptedOut()).toBe(false)
  })

  it('n’envoie rien en développement local (localhost)', () => {
    const beacon = vi.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true })
    expect(isTrackingAllowed()).toBe(false)
    track('CTA Click', { location: 'hero' })
    expect(beacon).not.toHaveBeenCalled()
  })

  it('track() ne lève jamais d’erreur, même si l’envoi échoue', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: () => {
        throw new Error('bloqué')
      },
      configurable: true,
    })
    expect(() => track('Demo Click')).not.toThrow()
  })
})
