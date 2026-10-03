import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  document.head.querySelectorAll('script[data-plausible]').forEach((s) => s.remove())
  delete window.plausible
})

describe('analytics', () => {
  it('sans VITE_PLAUSIBLE_DOMAIN : rien n’est chargé et track() ne fait rien', async () => {
    vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', '')
    const { ANALYTICS_ENABLED, initAnalytics, track } = await import('@/lib/analytics')
    initAnalytics()
    track('CTA Click', { location: 'hero' })
    expect(ANALYTICS_ENABLED).toBe(false)
    expect(document.querySelector('script[data-plausible]')).toBeNull()
    expect(window.plausible).toBeUndefined()
  })

  it('avec le domaine : charge le script une seule fois et envoie les évènements', async () => {
    vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', 'silkyplace.evenementscles.com')
    const { ANALYTICS_ENABLED, initAnalytics, track } = await import('@/lib/analytics')
    initAnalytics()
    initAnalytics()
    expect(ANALYTICS_ENABLED).toBe(true)
    const scripts = document.querySelectorAll('script[data-plausible]')
    expect(scripts).toHaveLength(1)
    expect((scripts[0] as HTMLScriptElement).dataset.domain).toBe('silkyplace.evenementscles.com')
    const spy = vi.fn()
    window.plausible = spy as never
    track('CTA Click', { location: 'hero' })
    expect(spy).toHaveBeenCalledWith('CTA Click', { props: { location: 'hero' } })
  })

  it('un évènement qui échoue ne casse jamais l’application', async () => {
    vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', 'silkyplace.evenementscles.com')
    const { track } = await import('@/lib/analytics')
    window.plausible = (() => {
      throw new Error('bloqué par un bloqueur de publicités')
    }) as never
    expect(() => track('Demo Click')).not.toThrow()
  })
})
