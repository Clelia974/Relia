import type { DayPhase } from '@/types/entities'

export const DAY_PHASE_LABELS: Record<DayPhase, string> = {
  installation: 'Installation',
  ceremonie: 'Cérémonie',
  reception: 'Réception',
  demontage: 'Démontage',
}

export const DAY_PHASE_OPTIONS: DayPhase[] = ['installation', 'ceremonie', 'reception', 'demontage']
