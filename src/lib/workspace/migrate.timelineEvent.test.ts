import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * 16. Import/export JSON — un workspace contenant un moment qui traverse
 * minuit doit rester valide au schéma persisté (durationMinutes positif,
 * jamais négatif) et se réimporter à l'identique. Le schéma exige
 * `durationMinutes` strictement positif : avant ce chantier, un moment
 * nocturne aurait produit une durée négative et fait échouer la validation
 * de tout le workspace au prochain chargement — exactement le scénario que
 * ce test verrouille.
 */
describe('migrateWorkspace — moment nocturne dans un import/export', () => {
  it('accepte un workspace contenant un moment 23:00 → 01:00 avec une durée positive (120 min)', () => {
    const base = createEmptyWorkspace()
    const wedding = {
      id: 'w1',
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
      archived: false,
      vendorIds: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const timelineEvent = {
      id: 'e1',
      weddingId: 'w1',
      title: 'Soirée dansante',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '23:00',
      endTime: '01:00',
      durationMinutes: 120,
      type: 'jalon',
      status: 'prevu',
      isPhotoMoment: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const workspace = { ...base, weddings: [wedding], timelineEvents: [timelineEvent] }

    // Import/export ne fait rien d'autre qu'un JSON.stringify/parse — on le
    // simule explicitement pour vérifier qu'aucune information n'est perdue
    // ou déformée au passage.
    const roundTripped = JSON.parse(JSON.stringify(workspace))
    const result = migrateWorkspace(roundTripped)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const event = result.workspace.timelineEvents[0]
    expect(event.startTime).toBe('23:00')
    expect(event.endTime).toBe('01:00')
    expect(event.durationMinutes).toBe(120)
  })

  it('rejette un workspace où durationMinutes serait négatif (rappel de la contrainte de schéma que ce chantier corrige en amont)', () => {
    const base = createEmptyWorkspace()
    const wedding = {
      id: 'w1',
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
      archived: false,
      vendorIds: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const timelineEvent = {
      id: 'e1',
      weddingId: 'w1',
      title: 'Soirée mal calculée',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '23:00',
      endTime: '01:00',
      durationMinutes: -1320, // l'ancien calcul (eh*60+em - sh*60+sm) sans gestion de minuit
      type: 'jalon',
      status: 'prevu',
      isPhotoMoment: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const workspace = { ...base, weddings: [wedding], timelineEvents: [timelineEvent] }

    const result = migrateWorkspace(workspace)
    expect(result.ok).toBe(false)
  })
})
