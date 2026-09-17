import type { EquipmentItem } from '@/types/entities'

export const UNCLASSIFIED_ZONE = 'Non classé'

/**
 * Éléments matériel d'un mariage nécessitant encore une action — pas encore
 * récupérés, OU récupérés mais sans destination renseignée (sinon l'item
 * disparaîtrait de la checklist juste après avoir coché "récupéré", sans
 * jamais avoir pu indiquer où il est parti).
 */
export function selectPendingEquipmentItems(items: EquipmentItem[], weddingId: string): EquipmentItem[] {
  return items.filter((e) => e.weddingId === weddingId && (e.status !== 'recupere' || !e.destination))
}

/** Groupe des éléments matériel par zone (category) — les éléments sans catégorie vont dans un groupe "Non classé" plutôt que de disparaître. */
export function groupEquipmentByZone(items: EquipmentItem[]): Map<string, EquipmentItem[]> {
  const byZone = new Map<string, EquipmentItem[]>()
  for (const item of items) {
    const zone = item.category ?? UNCLASSIFIED_ZONE
    if (!byZone.has(zone)) byZone.set(zone, [])
    byZone.get(zone)!.push(item)
  }
  return byZone
}

export interface BreakdownSummary {
  total: number
  returned: number
  damaged: number
  missingDestination: number
  zoneCount: number
}

/** Bilan de désinstallation pour UN mariage — jamais mélangé avec un autre (pas d'inventaire global). */
export function buildBreakdownSummary(items: EquipmentItem[], weddingId: string): BreakdownSummary {
  const weddingItems = items.filter((e) => e.weddingId === weddingId)
  return {
    total: weddingItems.length,
    returned: weddingItems.filter((e) => e.status === 'recupere').length,
    damaged: weddingItems.filter((e) => e.isDamaged).length,
    missingDestination: weddingItems.filter((e) => e.status === 'recupere' && !e.destination).length,
    zoneCount: groupEquipmentByZone(weddingItems).size,
  }
}
