import { describe, expect, it } from 'vitest'
import { detectTimelineConflicts } from '@/features/timeline/conflicts'
import type { TimelineEvent } from '@/types/entities'

let counter = 0
function makeEvent(overrides: Partial<TimelineEvent> & Pick<TimelineEvent, 'date'>): TimelineEvent {
  counter += 1
  return {
    id: overrides.id ?? `e${counter}`,
    weddingId: 'w1',
    title: overrides.title ?? `Moment ${counter}`,
    type: 'jalon',
    status: 'prevu',
    isPhotoMoment: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const DAY1 = '2026-06-06T00:00:00.000Z'
const DAY2 = '2026-06-07T00:00:00.000Z'

describe('detectTimelineConflicts — comportement existant (même jour, non-régression)', () => {
  it('4. deux événements 09:00-10:00 et 11:00-12:00 le même jour, sans marge insuffisante : aucun conflit', () => {
    const events = [
      makeEvent({ date: DAY1, startTime: '09:00', endTime: '10:00' }),
      makeEvent({ date: DAY1, startTime: '11:00', endTime: '12:00' }),
    ]
    expect(detectTimelineConflicts(events)).toEqual([])
  })

  it('détecte un chevauchement classique le même jour (comportement déjà existant, figé)', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, title: 'Installation florale', startTime: '11:00', endTime: '13:00' }),
      makeEvent({ id: 'b', date: DAY1, title: 'Livraison traiteur', startTime: '12:30', endTime: '13:30' }),
    ]
    const conflicts = detectTimelineConflicts(events)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ type: 'chevauchement', severity: 'critical', eventIds: ['a', 'b'] })
  })

  it('détecte une marge insuffisante entre deux événements consécutifs le même jour', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, startTime: '09:00', endTime: '10:00' }),
      makeEvent({ id: 'b', date: DAY1, startTime: '10:05', endTime: '11:00' }),
    ]
    const conflicts = detectTimelineConflicts(events, { minBufferMinutes: 15 })
    expect(conflicts.some((c) => c.type === 'buffer_insuffisant')).toBe(true)
  })

  it('9. heure de fin avant le début : ne déclenche plus "durée incohérente" (c\'est désormais un moment nocturne valide)', () => {
    const events = [makeEvent({ date: DAY1, startTime: '23:00', endTime: '01:00', durationMinutes: 120 })]
    expect(detectTimelineConflicts(events)).toEqual([])
  })

  it('durée nulle (fin === début) reste une anomalie "duree_incoherente" — règle produit inchangée', () => {
    const events = [makeEvent({ id: 'a', date: DAY1, title: 'Pause', startTime: '10:00', endTime: '10:00' })]
    const conflicts = detectTimelineConflicts(events)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ type: 'duree_incoherente', eventIds: ['a'] })
    expect(conflicts[0].message).toMatch(/durée est nulle/)
  })

  it('8. un événement sans horaire ne déclenche jamais de conflit horaire', () => {
    const events = [
      makeEvent({ date: DAY1, title: 'Jalon sans heure' }),
      makeEvent({ date: DAY1, startTime: '09:00', endTime: '10:00' }),
    ]
    expect(detectTimelineConflicts(events)).toEqual([])
  })

  it('livraison prestataire sans prestataire associé reste détectée, indépendamment des horaires', () => {
    const events = [makeEvent({ id: 'a', date: DAY1, type: 'livraison_prestataire', vendorId: undefined })]
    const conflicts = detectTimelineConflicts(events)
    expect(conflicts.some((c) => c.type === 'prestataire_manquant')).toBe(true)
  })
})

describe('detectTimelineConflicts — événements qui traversent minuit', () => {
  it('1+11. calcul de durée correct pour un mismatch durationMinutes sur un moment nocturne', () => {
    const events = [makeEvent({ id: 'a', date: DAY1, title: 'Soirée', startTime: '23:00', endTime: '01:00', durationMinutes: 999 })]
    const conflicts = detectTimelineConflicts(events)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].type).toBe('duree_incoherente')
    expect(conflicts[0].message).toMatch(/120 min/)
  })

  it('5. deux événements qui se touchent exactement (fin de A === début de B) ne sont pas un chevauchement', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, startTime: '22:00', endTime: '23:00' }),
      makeEvent({ id: 'b', date: DAY1, startTime: '23:00', endTime: '23:45' }),
    ]
    const conflicts = detectTimelineConflicts(events, { minBufferMinutes: 0 })
    expect(conflicts.some((c) => c.type === 'chevauchement')).toBe(false)
  })

  it('6. 12. chevauchement 23:00→01:00 avec 00:30→02:00 le lendemain : détecté malgré les deux jours civils différents', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, title: 'Soirée dansante', startTime: '23:00', endTime: '01:00' }),
      makeEvent({ id: 'b', date: DAY2, title: 'Montage matinal', startTime: '00:30', endTime: '02:00' }),
    ]
    const conflicts = detectTimelineConflicts(events)
    const overlap = conflicts.find((c) => c.type === 'chevauchement')
    expect(overlap).toBeDefined()
    expect(overlap?.eventIds.sort()).toEqual(['a', 'b'])
  })

  it('7. un moment nocturne et un événement du lendemain qui ne se chevauchent pas : aucun conflit', () => {
    const events = [
      makeEvent({ date: DAY1, title: 'Soirée', startTime: '23:00', endTime: '01:00' }),
      makeEvent({ date: DAY2, title: 'Brunch', startTime: '10:00', endTime: '11:00' }),
    ]
    expect(detectTimelineConflicts(events)).toEqual([])
  })

  it('10. deux événements sur des dates différentes qui ne se touchent pas : aucun conflit, même avec une petite marge configurée', () => {
    const events = [
      makeEvent({ date: DAY1, startTime: '09:00', endTime: '10:00' }),
      makeEvent({ date: DAY2, startTime: '09:00', endTime: '10:00' }),
    ]
    expect(detectTimelineConflicts(events, { minBufferMinutes: 60 })).toEqual([])
  })

  it('marge insuffisante détectée à cheval sur minuit (fin de nuit à 00:20, événement suivant à 00:30)', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, title: 'Soirée', startTime: '23:00', endTime: '00:20' }),
      makeEvent({ id: 'b', date: DAY2, title: 'Rangement', startTime: '00:30', endTime: '01:00' }),
    ]
    const conflicts = detectTimelineConflicts(events, { minBufferMinutes: 15 })
    expect(conflicts.some((c) => c.type === 'buffer_insuffisant' && c.eventIds.includes('a') && c.eventIds.includes('b'))).toBe(true)
  })

  it('le même prestataire engagé sur deux moments qui se chevauchent à cheval sur minuit est détecté', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, title: 'Soirée', startTime: '23:00', endTime: '01:00', vendorId: 'v1' }),
      makeEvent({ id: 'b', date: DAY2, title: 'Autre prestation', startTime: '00:30', endTime: '02:00', vendorId: 'v1' }),
    ]
    const conflicts = detectTimelineConflicts(events)
    expect(conflicts.some((c) => c.type === 'prestataire_conflit')).toBe(true)
  })

  it('le message de chevauchement mentionne "(+1 j)" pour le moment nocturne concerné', () => {
    const events = [
      makeEvent({ id: 'a', date: DAY1, title: 'Soirée', startTime: '23:00', endTime: '01:00' }),
      makeEvent({ id: 'b', date: DAY2, title: 'Montage', startTime: '00:30', endTime: '02:00' }),
    ]
    const conflicts = detectTimelineConflicts(events)
    const overlap = conflicts.find((c) => c.type === 'chevauchement')
    expect(overlap?.message).toContain('(+1 j)')
  })

  it("un event.date avec une heure parasite (données de démonstration créées via new Date()) ne produit pas de faux chevauchement avec un moment nocturne — bug détecté en vérification navigateur", () => {
    const events = [
      // Comme les données de démo : `date` porte une heure sans rapport avec startTime/endTime.
      makeEvent({ id: 'dj', date: '2026-09-29T06:43:58.392Z', title: 'Arrivée du DJ', startTime: '17:00', endTime: '17:15' }),
      makeEvent({ id: 'soiree', date: '2026-09-29T00:00:00.000Z', title: 'Soirée dansante', startTime: '23:00', endTime: '01:00' }),
    ]
    expect(detectTimelineConflicts(events)).toEqual([])
  })
})
