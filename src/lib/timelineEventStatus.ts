import type { TimelineEventStatus } from '@/types/entities'

export const TIMELINE_EVENT_STATUS_LABELS: Record<TimelineEventStatus, string> = {
  prevu: 'Prévu',
  confirme: 'Confirmé',
  a_verifier: 'À vérifier',
  termine: 'Terminé',
}

export const TIMELINE_EVENT_STATUS_OPTIONS: TimelineEventStatus[] = ['prevu', 'confirme', 'a_verifier', 'termine']
