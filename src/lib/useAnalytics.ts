import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '@/lib/analytics'

const MAX_SECONDS = 30 * 60
const MIN_SECONDS = 2

/**
 * Pages vues et durée passée sur chaque page, pour toute l'application (landing comprise).
 * La durée compte seulement le temps où l'onglet est visible, et s'envoie quand on change de page ou qu'on quitte.
 */
export function usePageTracking() {
  const { pathname } = useLocation()
  const startedAt = useRef<number | null>(null)
  const visibleMs = useRef(0)

  useEffect(() => {
    track('pageview', undefined, pathname)
    visibleMs.current = 0
    startedAt.current = document.visibilityState === 'visible' ? Date.now() : null

    const pause = () => {
      if (startedAt.current !== null) {
        visibleMs.current += Date.now() - startedAt.current
        startedAt.current = null
      }
    }
    const resume = () => {
      if (document.visibilityState === 'visible' && startedAt.current === null) startedAt.current = Date.now()
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? resume() : pause())
    const flush = () => {
      pause()
      const seconds = Math.min(Math.round(visibleMs.current / 1000), MAX_SECONDS)
      if (seconds >= MIN_SECONDS) track('Time on Page', { seconds }, pathname)
      visibleMs.current = 0
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [pathname])
}

/** Une fois par visite, note chaque section (`data-section="…"`) dès qu'elle est à moitié visible à l'écran. */
export function useSectionViews() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const seen = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = (entry.target as HTMLElement).dataset.section
          if (entry.isIntersecting && name && !seen.has(name)) {
            seen.add(name)
            track('Section View', { section: name })
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.4 },
    )
    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
