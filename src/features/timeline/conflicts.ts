import type { TimelineEvent } from '@/types/entities'

/** Valeur par défaut si le mariage ne définit pas sa propre marge minimale recommandée. */
export const DEFAULT_MIN_BUFFER_MINUTES = 15

export type ConflictType =
  | 'chevauchement'
  | 'buffer_insuffisant'
  | 'prestataire_conflit'
  | 'duree_incoherente'
  | 'prestataire_manquant'
  | 'transition_impossible'

export type ConflictSeverity = 'warning' | 'critical'

export interface TimelineConflict {
  /** Déterministe (type + événements triés) — stable d'un calcul à l'autre pour pouvoir être ignoré durablement. */
  id: string
  type: ConflictType
  severity: ConflictSeverity
  eventIds: string[]
  message: string
  suggestion: string
  /** Toujours false : un conflit résolu disparaît simplement de la détection au recalcul suivant, il n'est pas historisé. */
  resolved: boolean
  ignored: boolean
}

interface DetectOptions {
  minBufferMinutes?: number
  ignoredConflictIds?: string[]
}

function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function conflictId(type: ConflictType, eventIds: string[]): string {
  return `${type}:${[...eventIds].sort().join('+')}`
}

interface TimedEvent {
  event: TimelineEvent
  start: number
  end: number
}

/**
 * Détecte les conflits de planning d'un mariage : chevauchements, prestataire
 * double-réservé, marge insuffisante, durée incohérente, livraison sans
 * prestataire, transition impossible entre deux lieux. Fonction pure —
 * ne modifie rien, ne lit rien d'autre que les événements et les options
 * passées. Les conflits sont recalculés à chaque appel ; `ignoredConflictIds`
 * permet de faire persister la décision d'écarter une alerte précise.
 */
export function detectTimelineConflicts(events: TimelineEvent[], options: DetectOptions = {}): TimelineConflict[] {
  const minBuffer = options.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES
  const ignored = new Set(options.ignoredConflictIds ?? [])
  const conflicts: TimelineConflict[] = []

  const push = (type: ConflictType, severity: ConflictSeverity, eventIds: string[], message: string, suggestion: string) => {
    const id = conflictId(type, eventIds)
    if (conflicts.some((c) => c.id === id)) return
    conflicts.push({ id, type, severity, eventIds, message, suggestion, resolved: false, ignored: ignored.has(id) })
  }

  const byDate = new Map<string, TimelineEvent[]>()
  for (const event of events) {
    const key = event.date.slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(event)
  }

  for (const dayEvents of byDate.values()) {
    const timed: TimedEvent[] = []

    for (const event of dayEvents) {
      // 6. livraison prestataire sans prestataire associé
      if (event.type === 'livraison_prestataire' && !event.vendorId) {
        push(
          'prestataire_manquant',
          'warning',
          [event.id],
          `« ${event.title} » est une livraison prestataire sans prestataire associé.`,
          'Associez le prestataire concerné à ce moment.',
        )
      }

      if (!event.startTime || !event.endTime) continue
      const start = toMinutes(event.startTime)
      const end = toMinutes(event.endTime)
      if (start === null || end === null) continue

      // 5. durée incohérente
      if (end <= start) {
        push(
          'duree_incoherente',
          'warning',
          [event.id],
          `« ${event.title} » a une heure de fin (${event.endTime}) antérieure ou égale à l'heure de début (${event.startTime}).`,
          'Corrigez les horaires de ce moment.',
        )
      } else if (event.durationMinutes !== undefined && event.durationMinutes !== end - start) {
        push(
          'duree_incoherente',
          'warning',
          [event.id],
          `« ${event.title} » : la durée renseignée (${event.durationMinutes} min) ne correspond pas au créneau ${event.startTime}–${event.endTime} (${end - start} min).`,
          'Corrigez la durée ou les horaires de ce moment.',
        )
      }

      timed.push({ event, start, end })
    }

    // 1 + 3. chevauchements et double-réservation prestataire — toutes les paires du même jour
    for (let i = 0; i < timed.length; i++) {
      for (let j = i + 1; j < timed.length; j++) {
        const a = timed[i]
        const b = timed[j]
        const overlap = a.start < b.end && b.start < a.end
        if (!overlap) continue

        push(
          'chevauchement',
          'critical',
          [a.event.id, b.event.id],
          `« ${a.event.title} » (${a.event.startTime}–${a.event.endTime}) chevauche « ${b.event.title} » (${b.event.startTime}–${b.event.endTime}).`,
          "Décalez l'un des deux moments pour qu'ils ne se superposent plus.",
        )

        if (a.event.vendorId && a.event.vendorId === b.event.vendorId) {
          push(
            'prestataire_conflit',
            'critical',
            [a.event.id, b.event.id],
            `Le même prestataire est engagé sur « ${a.event.title} » et « ${b.event.title} » au même moment.`,
            'Vérifiez la disponibilité du prestataire ou décalez l\'un des deux moments.',
          )
        }
      }
    }

    // 2 + 4 + 7. ordre chronologique, marge insuffisante, transition entre lieux — événements consécutifs
    const sorted = [...timed].sort((a, b) => a.start - b.start)
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]
      const b = sorted[i + 1]
      if (b.start < a.end) continue // déjà couvert par le chevauchement ci-dessus

      const gap = b.start - a.end
      if (gap < minBuffer) {
        push(
          'buffer_insuffisant',
          'warning',
          [a.event.id, b.event.id],
          `Fin de « ${a.event.title} » : ${a.event.endTime}\nDébut de « ${b.event.title} » : ${b.event.startTime}\nMarge actuelle : ${gap} minute${gap !== 1 ? 's' : ''}`,
          `Prévoyez au moins ${minBuffer} minutes entre ces deux moments, ou décalez « ${b.event.title} ».`,
        )
      }

      if (a.event.location && b.event.location && a.event.location !== b.event.location && gap < minBuffer) {
        push(
          'transition_impossible',
          'warning',
          [a.event.id, b.event.id],
          `« ${a.event.title} » (${a.event.location}) et « ${b.event.title} » (${b.event.location}) sont à des lieux différents, avec seulement ${gap} minute${gap !== 1 ? 's' : ''} entre les deux.`,
          'Prévoyez un temps de trajet suffisant ou revoyez l\'ordre du planning.',
        )
      }
    }
  }

  return conflicts
}
