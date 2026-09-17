import type { EquipmentStatus } from '@/types/entities'

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  a_prevoir: 'À prévoir',
  pret: 'Prêt',
  charge: 'Chargé',
  installe: 'Installé',
  recupere: 'Récupéré',
}

export const EQUIPMENT_STATUS_OPTIONS: EquipmentStatus[] = ['a_prevoir', 'pret', 'charge', 'installe', 'recupere']
