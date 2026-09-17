import { absoluteInstant, formatTimeRange, resolveTimeRange } from '@/features/timeline/timeRange'
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

function conflictId(type: ConflictType, eventIds: string[]): string {
  return `${type}:${[...eventIds].sort().join('+')}`
}

interface TimedEvent {
  event: TimelineEvent
  /** Instant absolu (ms epoch) — permet de comparer deux événements même s'ils sont datés sur deux jours civils différents (moment nocturne à cheval sur minuit). */
  startMs: number
  endMs: number
  crossesMidnight: boolean
}

/**
 * Détecte les conflits de planning d'un mariage : chevauchements, prestataire
 * double-réservé, marge insuffisante, durée incohérente, livraison sans
 * prestataire, transition impossible entre deux lieux. Fonction pure —
 * ne modifie rien, ne lit rien d'autre que les événements et les options
 * passées. Les conflits sont recalculés à chaque appel ; `ignoredConflictIds`
 * permet de faire persister la décision d'écarter une alerte précise.
 *
 * Comparaison par instant absolu (et non plus par regroupement par jour
 * civil) : un moment qui traverse minuit (23:00→01:00) doit pouvoir être
 * comparé aux événements du lendemain matin, ce qu'un cloisonnement par
 * `event.date` rendait impossible.
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

  // 6. livraison prestataire sans prestataire associé — indépendant des horaires, jamais un "conflit horaire".
  for (const event of events) {
    if (event.type === 'livraison_prestataire' && !event.vendorId) {
      push(
        'prestataire_manquant',
        'warning',
        [event.id],
        `« ${event.title} » est une livraison prestataire sans prestataire associé.`,
        'Associez le prestataire concerné à ce moment.',
      )
    }
  }

  // Un événement sans heure de début ET de fin n'est jamais comparé : ni
  // chevauchement, ni marge, ni durée incohérente ne peuvent s'appliquer à
  // un horaire qui n'existe pas.
  const timed: TimedEvent[] = []
  for (const event of events) {
    if (!event.startTime || !event.endTime) continue
    const range = resolveTimeRange(event.startTime, event.endTime)
    if (!range) continue

    // 5. durée incohérente — deux anomalies distinctes, jamais confondues :
    // une égalité stricte (fin === début) est une durée nulle, une vraie
    // anomalie de saisie ; une fin antérieure au début n'en est plus une
    // depuis ce chantier — elle signifie que le moment se termine le
    // lendemain (cf. timeRange.ts). C'est la règle produit actuelle,
    // documentée ici explicitement.
    if (range.durationMinutes === 0) {
      push(
        'duree_incoherente',
        'warning',
        [event.id],
        `« ${event.title} » a une heure de fin identique à l'heure de début (${event.startTime}) : la durée est nulle.`,
        "Modifiez l'heure de fin pour qu'elle soit différente de l'heure de début.",
      )
    } else if (event.durationMinutes !== undefined && event.durationMinutes !== range.durationMinutes) {
      push(
        'duree_incoherente',
        'warning',
        [event.id],
        `« ${event.title} » : la durée renseignée (${event.durationMinutes} min) ne correspond pas au créneau ${formatTimeRange(event.startTime, event.endTime)} (${range.durationMinutes} min).`,
        'Corrigez la durée ou les horaires de ce moment.',
      )
    }

    timed.push({
      event,
      startMs: absoluteInstant(event.date, range.startMinutes),
      endMs: absoluteInstant(event.date, range.endMinutes),
      crossesMidnight: range.crossesMidnight,
    })
  }

  // 1 + 3. chevauchements et double-réservation prestataire — toutes les paires, quel que soit le jour civil.
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i]
      const b = timed[j]
      const overlap = a.startMs < b.endMs && b.startMs < a.endMs
      if (!overlap) continue

      push(
        'chevauchement',
        'critical',
        [a.event.id, b.event.id],
        `« ${a.event.title} » (${formatTimeRange(a.event.startTime!, a.event.endTime!)}) chevauche « ${b.event.title} » (${formatTimeRange(b.event.startTime!, b.event.endTime!)}).`,
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

  // 2 + 4 + 7. ordre chronologique, marge insuffisante, transition entre lieux — événements consécutifs par instant absolu.
  const sorted = [...timed].sort((a, b) => a.startMs - b.startMs)
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (b.startMs < a.endMs) continue // déjà couvert par le chevauchement ci-dessus

    const gap = (b.startMs - a.endMs) / 60_000
    if (gap < minBuffer) {
      push(
        'buffer_insuffisant',
        'warning',
        [a.event.id, b.event.id],
        `Fin de « ${a.event.title} » : ${a.event.endTime}${a.crossesMidnight ? ' (+1 j)' : ''}\nDébut de « ${b.event.title} » : ${b.event.startTime}\nMarge actuelle : ${gap} minute${gap !== 1 ? 's' : ''}`,
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

  return conflicts
}
