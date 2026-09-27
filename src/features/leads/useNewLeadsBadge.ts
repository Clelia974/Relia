import { useEffect, useState } from 'react'
import { countNewLeads } from '@/features/leads/leadsApi'
import { useAuth } from '@/hooks/useAuth'

const REFRESH_INTERVAL_MS = 60_000

/**
 * Compteur discret dans la navigation (jamais de notification qui
 * sollicite activement — l'objectif est qu'elle regarde quand elle
 * ouvre l'appli, pas d'être relancée). Se met à jour toute seule tant
 * que l'appli reste ouverte, sans action de sa part.
 */
export function useNewLeadsBadge(): number {
  const { isAuthenticated } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    const refresh = () => {
      countNewLeads()
        .then((result) => {
          if (!cancelled) setCount(result)
        })
        .catch(() => {
          // Silencieux : un badge qui ne se met pas à jour un instant n'est jamais bloquant.
        })
    }

    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isAuthenticated])

  return count
}
