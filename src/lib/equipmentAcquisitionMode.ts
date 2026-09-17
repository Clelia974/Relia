import type { EquipmentAcquisitionMode } from '@/types/entities'

export const EQUIPMENT_ACQUISITION_MODE_LABELS: Record<EquipmentAcquisitionMode, string> = {
  stock_personnel: 'Stock personnel',
  achat: 'Achat',
  location: 'Location',
  fabrication: 'Fabrication',
  autre: 'Autre',
}

export const EQUIPMENT_ACQUISITION_MODE_OPTIONS: EquipmentAcquisitionMode[] = [
  'stock_personnel',
  'achat',
  'location',
  'fabrication',
  'autre',
]
