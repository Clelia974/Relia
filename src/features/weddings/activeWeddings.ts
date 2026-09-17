import type { Wedding } from '@/types/entities'

/**
 * Source unique de vérité pour l'exclusion des mariages archivés des vues,
 * actions et agrégations globales. Toute vue qui doit ignorer les mariages
 * archivés passe par ces deux helpers plutôt que de répéter `!w.archived`.
 */
export function selectActiveWeddings(weddings: Wedding[]): Wedding[] {
  return weddings.filter((w) => !w.archived)
}

export function selectActiveWeddingIds(weddings: Wedding[]): Set<string> {
  return new Set(selectActiveWeddings(weddings).map((w) => w.id))
}
