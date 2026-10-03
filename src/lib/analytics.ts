/**
 * Mesure d'audience Plausible — sans cookie, sans donnée personnelle, hébergée en Europe.
 *
 * Désactivée tant que `VITE_PLAUSIBLE_DOMAIN` n'est pas défini (Vercel > Settings > Environment Variables) :
 * aucun script chargé, aucun appel réseau, et les pages légales gardent leur texte « aucune mesure d'audience »
 * (cf. ANALYTICS_ENABLED). `track()` ne fait alors rien et ne casse jamais l'application.
 *
 * Pages vues et durée de la visite : comptées automatiquement par le script (navigation interne comprise).
 * Évènements personnalisés : voir `track()` aux endroits clés (boutons d'appel à l'action, formulaires, paiement).
 * Objectifs de conversion à déclarer dans Plausible (Settings > Goals > Custom event) :
 * « Signup Success », « Checkout Start », « Payment Success ».
 */
type EventProps = Record<string, string | number | boolean>

type PlausibleFn = ((event: string, options?: { props?: EventProps }) => void) & { q?: unknown[] }

declare global {
  interface Window {
    plausible?: PlausibleFn
  }
}

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined

export const ANALYTICS_ENABLED = Boolean(DOMAIN)

/** Charge le script Plausible (une seule fois). À appeler au démarrage de l'application. */
export function initAnalytics() {
  if (!DOMAIN || typeof document === 'undefined') return
  if (document.querySelector('script[data-plausible]')) return
  // File d'attente officielle : les évènements émis avant le chargement du script ne sont pas perdus.
  window.plausible =
    window.plausible ??
    (function (...args: unknown[]) {
      ;(window.plausible!.q = window.plausible!.q ?? []).push(args)
    } as PlausibleFn)
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://plausible.io/js/script.js'
  script.dataset.domain = DOMAIN
  script.dataset.plausible = '1'
  document.head.appendChild(script)
}

/** Envoie un évènement personnalisé. Sans effet si la mesure d'audience est désactivée. */
export function track(event: string, props?: EventProps) {
  if (!ANALYTICS_ENABLED) return
  try {
    window.plausible?.(event, props ? { props } : undefined)
  } catch {
    // La mesure ne doit jamais gêner l'utilisatrice.
  }
}
