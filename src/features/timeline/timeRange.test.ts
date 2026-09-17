import { describe, expect, it } from 'vitest'
import { absoluteInstant, formatTimeRange, resolveTimeRange, toMinutesSinceMidnight } from '@/features/timeline/timeRange'

describe('toMinutesSinceMidnight', () => {
  it('convertit une heure valide', () => {
    expect(toMinutesSinceMidnight('09:00')).toBe(540)
    expect(toMinutesSinceMidnight('23:30')).toBe(1410)
    expect(toMinutesSinceMidnight('00:00')).toBe(0)
  })

  it('retourne null pour un format invalide', () => {
    expect(toMinutesSinceMidnight('')).toBeNull()
    expect(toMinutesSinceMidnight('abc')).toBeNull()
  })
})

describe('resolveTimeRange — calcul de durée (scénarios 1-4, 9, 11)', () => {
  it('1. 23:00 → 01:00 le lendemain : traverse minuit, 120 minutes', () => {
    const range = resolveTimeRange('23:00', '01:00')
    expect(range).toEqual({ startMinutes: 1380, endMinutes: 1500, crossesMidnight: true, durationMinutes: 120 })
  })

  it('2. 23:00 → 02:00 le lendemain : traverse minuit, 180 minutes', () => {
    const range = resolveTimeRange('23:00', '02:00')
    expect(range).toEqual({ startMinutes: 1380, endMinutes: 1560, crossesMidnight: true, durationMinutes: 180 })
  })

  it('3. 23:30 → 23:45 le même jour : ne traverse pas minuit, 15 minutes', () => {
    const range = resolveTimeRange('23:30', '23:45')
    expect(range).toEqual({ startMinutes: 1410, endMinutes: 1425, crossesMidnight: false, durationMinutes: 15 })
  })

  it('4. 09:00 → 10:00 : cas nominal même jour, 60 minutes', () => {
    const range = resolveTimeRange('09:00', '10:00')
    expect(range).toEqual({ startMinutes: 540, endMinutes: 600, crossesMidnight: false, durationMinutes: 60 })
  })

  it('9. heure de fin avant le début (23:30 → 02:00) : traverse minuit, jamais une exception', () => {
    const range = resolveTimeRange('23:30', '02:00')
    expect(range?.crossesMidnight).toBe(true)
    expect(range?.durationMinutes).toBe(150)
  })

  it("durée nulle : fin === début n'est jamais une traversée de minuit", () => {
    const range = resolveTimeRange('10:00', '10:00')
    expect(range).toEqual({ startMinutes: 600, endMinutes: 600, crossesMidnight: false, durationMinutes: 0 })
  })

  it('8. événement sans horaire : retourne null, jamais une exception', () => {
    expect(resolveTimeRange(undefined, '10:00')).toBeNull()
    expect(resolveTimeRange('10:00', undefined)).toBeNull()
    expect(resolveTimeRange(undefined, undefined)).toBeNull()
  })
})

describe('absoluteInstant', () => {
  it('ajoute les minutes à minuit UTC du jour donné', () => {
    const dayStart = Date.parse('2026-06-06T00:00:00.000Z')
    expect(absoluteInstant('2026-06-06T00:00:00.000Z', 0)).toBe(dayStart)
    expect(absoluteInstant('2026-06-06T00:00:00.000Z', 1500)).toBe(dayStart + 1500 * 60_000)
  })

  it("ignore toute heure déjà présente dans isoDate (données de démonstration construites via new Date())", () => {
    const dayStart = Date.parse('2026-09-29T00:00:00.000Z')
    // Même jour civil, mais avec une heure parasite (06:43:58.392) sans rapport avec startTime/endTime.
    expect(absoluteInstant('2026-09-29T06:43:58.392Z', 1020)).toBe(dayStart + 1020 * 60_000)
  })
})

describe('formatTimeRange', () => {
  it('ajoute "(+1 j)" uniquement pour un créneau qui traverse minuit', () => {
    expect(formatTimeRange('23:00', '01:00')).toBe('23:00–01:00 (+1 j)')
    expect(formatTimeRange('09:00', '10:00')).toBe('09:00–10:00')
    expect(formatTimeRange('10:00', '10:00')).toBe('10:00–10:00')
  })
})
