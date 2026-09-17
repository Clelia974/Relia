/**
 * Résolution des plages horaires d'un moment de planning (Phase 0 —
 * traversée de minuit). Point de calcul unique pour la durée et la
 * comparaison des créneaux, réutilisé par le formulaire, le store et la
 * détection de conflits — jusqu'ici dupliqué indépendamment à plusieurs
 * endroits en supposant que la fin est toujours le même jour que le début,
 * ce qui rendait un moment du type 23:00→01:00 impossible à saisir et,
 * s'il existait, mal interprété partout.
 *
 * Règle produit : une heure de fin strictement antérieure à l'heure de
 * début signifie que le moment se termine le lendemain (jamais plus tard).
 * Une égalité stricte (fin === début) N'EST PAS une traversée de minuit :
 * c'est une durée nulle, traitée comme une anomalie distincte (cf.
 * conflicts.ts, type "duree_incoherente") — c'est la règle produit actuelle,
 * volontairement inchangée par ce chantier.
 */

/** Convertit "HH:MM" en minutes depuis minuit. Null si le format est invalide. */
export function toMinutesSinceMidnight(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export interface ResolvedTimeRange {
  /** Minutes depuis minuit du jour de l'événement (`event.date`). */
  startMinutes: number
  /**
   * Minutes depuis minuit du jour de l'événement — dépasse 1439 lorsque le
   * moment se termine le lendemain (ex. 90 pour 01:30 le jour suivant), pour
   * rester directement comparable à `startMinutes` sans branchement
   * supplémentaire chez l'appelant.
   */
  endMinutes: number
  /** true si l'heure de fin est strictement antérieure à l'heure de début. */
  crossesMidnight: boolean
  /** end - start ; toujours positive sauf égalité stricte (0, cf. durée nulle ci-dessus). */
  durationMinutes: number
}

/**
 * Résout un couple (startTime, endTime) en plage exploitable. Retourne null
 * si l'un des deux horaires est absent ou mal formé — jamais une exception :
 * un moment sans horaire complet ne doit jamais faire planter un calcul en
 * aval, seulement être exclu des comparaisons qui en ont besoin.
 */
export function resolveTimeRange(startTime: string | undefined, endTime: string | undefined): ResolvedTimeRange | null {
  if (!startTime || !endTime) return null
  const start = toMinutesSinceMidnight(startTime)
  const end = toMinutesSinceMidnight(endTime)
  if (start === null || end === null) return null

  const crossesMidnight = end < start
  const endMinutes = crossesMidnight ? end + 24 * 60 : end
  return { startMinutes: start, endMinutes, crossesMidnight, durationMinutes: endMinutes - start }
}

/**
 * Instant absolu (ms epoch) correspondant à `minutesSinceMidnight` minutes
 * après minuit UTC du jour civil de `isoDate`.
 *
 * Ne fait JAMAIS confiance à l'heure éventuellement présente dans `isoDate` :
 * seuls ses 10 premiers caractères (YYYY-MM-DD) sont utilisés, exactement
 * comme le reste du code traite déjà `event.date` partout ailleurs
 * (`.slice(0, 10)`). C'est nécessaire : les données de démonstration
 * (`createDemoWorkspace`) construisent leurs dates via `new Date()` sans
 * jamais les ramener à minuit, donc `event.date` peut légitimement contenir
 * une heure quelconque (ex. "2026-09-29T06:43:58.392Z") sans rapport avec
 * `startTime`/`endTime`. Faire confiance à cette heure aurait décalé le
 * calcul et produit de faux chevauchements avec des événements existants,
 * sans lien avec la traversée de minuit — détecté en vérification navigateur
 * sur les données de démonstration.
 */
export function absoluteInstant(isoDate: string, minutesSinceMidnight: number): number {
  const dayStart = Date.parse(`${isoDate.slice(0, 10)}T00:00:00.000Z`)
  return dayStart + minutesSinceMidnight * 60_000
}

/** "23:00–01:00 (+1 j)" — pour tout affichage textuel d'un créneau qui peut traverser minuit. */
export function formatTimeRange(startTime: string, endTime: string): string {
  const range = resolveTimeRange(startTime, endTime)
  return `${startTime}–${endTime}${range?.crossesMidnight ? ' (+1 j)' : ''}`
}
