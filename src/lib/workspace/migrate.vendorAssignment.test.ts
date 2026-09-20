import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v10 -> v11 (Phase 3) : status et arrivalTime quittent Vendor
 * pour VendorWeddingLink (une affectation par mariage).
 */
describe('migration v10 -> v11 (affectations prestataire par mariage)', () => {
  const wedding = (id: string) => ({
    id,
    coupleName: `Couple ${id}`,
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 0,
    clientBudget: 0,
    status: 'signe',
    archived: false,
    vendorIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  })

  function v10(vendors: unknown[], links: unknown[] = []) {
    return {
      ...createEmptyWorkspace(),
      schemaVersion: 10,
      weddings: [wedding('w1'), wedding('w2'), wedding('w3')],
      vendors,
      vendorWeddingLinks: links,
    }
  }

  it('prestataire lié à 0 mariage : conservé, sans lien, sans statut global', () => {
    const result = migrateWorkspace(v10([{ id: 'v1', name: 'Seul', category: 'DJ', status: 'confirme', arrivalTime: '10:00', weddingIds: [] }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.workspace.vendors).toHaveLength(1)
    expect(result.workspace.vendors[0].name).toBe('Seul')
    expect('status' in result.workspace.vendors[0]).toBe(false)
    expect('arrivalTime' in result.workspace.vendors[0]).toBe(false)
    expect(result.workspace.vendorWeddingLinks).toHaveLength(0)
  })

  it('prestataire lié à 1 mariage : lien créé avec le statut et l\'horaire', () => {
    const result = migrateWorkspace(v10([{ id: 'v1', name: 'Traiteur', category: 'Traiteur', status: 'confirme', arrivalTime: '10:00', weddingIds: ['w1'] }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.vendorWeddingLinks).toHaveLength(1)
    expect(result.workspace.vendorWeddingLinks[0]).toMatchObject({ vendorId: 'v1', weddingId: 'w1', status: 'confirme', arrivalTime: '10:00' })
  })

  it('prestataire lié à plusieurs mariages : chaque affectation reçoit le statut/horaire actuels, indépendants ensuite', () => {
    const result = migrateWorkspace(v10([{ id: 'v1', name: 'DJ', category: 'DJ', status: 'devis_recu', arrivalTime: '18:00', weddingIds: ['w1', 'w2', 'w3'] }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const links = result.workspace.vendorWeddingLinks
    expect(links).toHaveLength(3)
    expect(links.every((l) => l.status === 'devis_recu' && l.arrivalTime === '18:00')).toBe(true)
    expect(new Set(links.map((l) => l.id)).size).toBe(3)
  })

  it('préserve coûts, needsCostReview et liens existants ; ne duplique pas un lien', () => {
    const result = migrateWorkspace(
      v10(
        [{ id: 'v1', name: 'Traiteur', category: 'Traiteur', status: 'confirme', weddingIds: ['w1', 'w2'] }],
        [
          { id: 'l1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 3000, actualCost: 3100, needsCostReview: true },
          { id: 'l2', vendorId: 'v1', weddingId: 'w2', estimatedCost: 2000 },
        ],
      ),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const links = result.workspace.vendorWeddingLinks
    expect(links).toHaveLength(2)
    expect(links.find((l) => l.id === 'l1')).toMatchObject({ estimatedCost: 3000, actualCost: 3100, needsCostReview: true, status: 'confirme' })
    expect(links.find((l) => l.id === 'l2')).toMatchObject({ estimatedCost: 2000, status: 'confirme' })
    expect(links.find((l) => l.id === 'l2')?.needsCostReview).toBeUndefined()
  })

  it('préserve les relations prestataire↔mariage et les notes générales', () => {
    const result = migrateWorkspace(v10([{ id: 'v1', name: 'Fleuriste', category: 'Fleuriste', status: 'contacte', notes: 'Note', weddingIds: ['w1', 'w2'] }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.vendors[0].weddingIds).toEqual(['w1', 'w2'])
    expect(result.workspace.vendors[0].notes).toBe('Note')
  })

  it('une donnée sans statut est lue comme "a_contacter"', () => {
    const result = migrateWorkspace(v10([{ id: 'v1', name: 'X', category: 'DJ', weddingIds: ['w1'] }]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.vendorWeddingLinks[0].status).toBe('a_contacter')
  })

  it('est stable : re-migrer le résultat ne change rien', () => {
    const first = migrateWorkspace(v10([{ id: 'v1', name: 'DJ', category: 'DJ', status: 'confirme', weddingIds: ['w1', 'w2'] }]))
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = migrateWorkspace(first.workspace)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.workspace.vendorWeddingLinks).toEqual(first.workspace.vendorWeddingLinks)
  })
})
