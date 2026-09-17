import type { EquipmentDestination } from '@/types/entities'

export const EQUIPMENT_DESTINATION_LABELS: Record<EquipmentDestination, string> = {
  stock: 'Retour au stock',
  fournisseur: 'Retour fournisseur',
  poubelle: 'Poubelle / recyclage',
  autre: 'Autre',
}

export const EQUIPMENT_DESTINATION_OPTIONS: EquipmentDestination[] = ['stock', 'fournisseur', 'poubelle', 'autre']
