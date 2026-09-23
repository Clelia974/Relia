import { useEffect, useState } from 'react'

export interface LaunchOfferAvailability {
  limit: number
  redeemed: number
  remaining: number
  available: boolean
}

interface UseLaunchOfferAvailabilityResult {
  offer: LaunchOfferAvailability | null
  isLoading: boolean
}

/**
 * Lit le nombre réel de places prises sur l'offre de lancement
 * (api/launch-offer-count.ts) — jamais un chiffre codé en dur côté front.
 * `offer` reste `null` tant que l'appel n'a pas abouti (page publique,
 * accessible sans compte : pas d'affichage de secours qui inventerait un
 * nombre). Un échec réseau laisse aussi `offer` à `null` plutôt que
 * d'afficher une place disponible par défaut.
 */
export function useLaunchOfferAvailability(): UseLaunchOfferAvailabilityResult {
  const [offer, setOffer] = useState<LaunchOfferAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/launch-offer-count')
      .then((res) => (res.ok ? (res.json() as Promise<LaunchOfferAvailability>) : null))
      .then((data) => {
        if (active) setOffer(data)
      })
      .catch(() => {
        if (active) setOffer(null)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { offer, isLoading }
}
