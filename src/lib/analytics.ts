/**
 * Mesure d'audience maison — anonyme, sans cookie, sans service tiers, gratuite.
 *
 * Ce qui est enregistré (api/track.ts → table analytics_events) : le nom d'un évènement (page vue, clic sur un
 * bouton, section affichée, durée passée sur une page), le chemin de la page SANS identifiant ni paramètre, et
 * quelques propriétés simples (ex. l'endroit du bouton cliqué). Jamais : adresse IP, user-agent, compte,
 * identifiant de session ou de navigateur — rien ne permet de reconnaître une personne d'une visite à l'autre.
 * Conservation : 13 mois maximum.
 *
 * Respect du choix de la personne : rien n'est envoyé si le navigateur envoie « Do Not Track » ou « Global
 * Privacy Control », ni si elle a coché « Ne pas me compter » sur la page Cookies.
 * Rien n'est envoyé non plus en développement local (localhost).
 *
 * Objectifs de conversion suivis : Signup Success (compte créé), Checkout Start (paiement commencé),
 * Payment Success (paiement validé, page /merci).
 */
type EventProps = Record<string, string | number | boolean>

const OPT_OUT_KEY = 'silkyplace-no-analytics'
const ENDPOINT = '/api/track'

/** La mesure existe toujours côté produit ; les pages légales en parlent donc en permanence. */
export const ANALYTICS_ENABLED = true

function isLocalDev() {
  return typeof window === 'undefined' || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
}

/** « Ne pas me compter » coché sur la page Cookies. */
export function hasOptedOut(): boolean {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setOptedOut(value: boolean) {
  try {
    if (value) window.localStorage.setItem(OPT_OUT_KEY, '1')
    else window.localStorage.removeItem(OPT_OUT_KEY)
  } catch {
    // stockage indisponible : le choix ne pourra pas être mémorisé
  }
}

function browserSaysNo(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true
}

export function isTrackingAllowed(): boolean {
  return !isLocalDev() && !browserSaysNo() && !hasOptedOut()
}

/** Envoie un évènement anonyme. Ne lève jamais d'erreur et ne gêne jamais l'utilisatrice. */
export function track(name: string, props?: EventProps, path?: string) {
  if (!isTrackingAllowed()) return
  try {
    const payload = JSON.stringify({ name, path: path ?? window.location.pathname, props })
    // sendBeacon survit à la fermeture de l'onglet (utile pour la durée sur la page) ; fetch en secours.
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(ENDPOINT, payload)) return
    void fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
  } catch {
    // La mesure ne doit jamais gêner l'utilisatrice.
  }
}
