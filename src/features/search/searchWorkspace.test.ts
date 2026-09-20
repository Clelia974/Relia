import { describe, expect, it } from 'vitest'
import { normalizeSearchText, searchWorkspace } from '@/features/search/searchWorkspace'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import type { Workspace } from '@/types/entities'

const base = createEmptyWorkspace()
const stamp = '2026-01-01T00:00:00.000Z'

const ws: Workspace = {
  ...base,
  weddings: [
    { id: 'w1', coupleName: 'Élodie & Marc', date: stamp, venue: 'Château de Villette', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: stamp, updatedAt: stamp },
    { id: 'w2', coupleName: 'Camille & Antoine', date: stamp, venue: 'Domaine de la Prairie', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: stamp, updatedAt: stamp },
  ],
  vendors: [{ id: 'v1', name: 'Bastien Caron', company: 'DJ Bastien Prod', category: 'DJ', weddingIds: ['w2'] }],
  proposals: [
    {
      id: 'p1', weddingId: 'w1', proposalNumber: 'DEV-2026-0007', template: 'gold', title: 'Proposition Gold', clientName: 'Élodie & Marc',
      lineItems: [], subtotal: 0, vatMode: 'franchise_en_base', taxAmount: 0, total: 0, depositAmount: 0, balanceAmount: 0, status: 'brouillon', createdAt: stamp, updatedAt: stamp,
    },
  ],
  invoices: [
    {
      id: 'i1', weddingId: 'w1', invoiceNumber: 'FACT-2026-0003', date: stamp, clientName: 'Élodie & Marc', lineItems: [], subtotal: 0, vatMode: 'franchise_en_base',
      taxAmount: 0, total: 0, isIndicativePreview: true, status: 'brouillon', createdAt: stamp, updatedAt: stamp,
    },
  ],
  tasks: [
    { id: 't1', title: 'Confirmer le DJ', weddingId: 'w2', status: 'a_faire', priority: 'normale', postponedCount: 0, postponeHistory: [], source: 'manual', createdAt: stamp, updatedAt: stamp },
    { id: 't2', title: 'Tâche sans mariage', status: 'a_faire', priority: 'normale', postponedCount: 0, postponeHistory: [], source: 'manual', createdAt: stamp, updatedAt: stamp },
  ],
}

describe('searchWorkspace', () => {
  it('ignore les accents et la casse', () => {
    expect(normalizeSearchText('Élodie')).toBe('elodie')
    expect(searchWorkspace(ws, 'ELODIE').map((r) => r.id)).toContain('w1')
  })

  it('une requête vide ne renvoie rien', () => {
    expect(searchWorkspace(ws, '   ')).toEqual([])
  })

  it('trouve un mariage par le lieu', () => {
    expect(searchWorkspace(ws, 'villette')[0]).toMatchObject({ kind: 'mariage', id: 'w1', href: '/mariages/w1' })
  })

  it('trouve un prestataire et pointe vers sa fiche', () => {
    expect(searchWorkspace(ws, 'bastien')[0]).toMatchObject({ kind: 'prestataire', href: '/prestataires?fiche=v1' })
  })

  it('trouve un devis par son numéro, une facture par la sienne', () => {
    expect(searchWorkspace(ws, 'DEV-2026-0007')[0]).toMatchObject({ kind: 'devis', href: '/mariages/w1/documents/propositions/p1' })
    expect(searchWorkspace(ws, 'fact-2026-0003')[0]).toMatchObject({ kind: 'facture', href: '/mariages/w1/documents/factures/i1' })
  })

  it("chaque mot doit correspondre (recherche d'un devis par le nom du couple)", () => {
    const kinds = searchWorkspace(ws, 'elodie gold').map((r) => r.kind)
    expect(kinds).toEqual(['devis'])
  })

  it('une tâche sans mariage renvoie vers la liste globale', () => {
    expect(searchWorkspace(ws, 'sans mariage')[0]).toMatchObject({ kind: 'tache', href: '/taches' })
  })

  it('groupe dans l\'ordre mariages, prestataires, devis, factures, tâches', () => {
    const kinds = searchWorkspace(ws, 'dj').map((r) => r.kind)
    expect(kinds).toEqual(['prestataire', 'tache'])
  })

  it('limite à 5 résultats par type', () => {
    const many: Workspace = {
      ...ws,
      tasks: Array.from({ length: 9 }, (_, i) => ({ ...ws.tasks[0], id: `t${i}`, title: `Relancer ${i}` })),
    }
    expect(searchWorkspace(many, 'relancer')).toHaveLength(5)
  })
})
