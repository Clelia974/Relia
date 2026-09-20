import { describe, expect, it } from 'vitest'
import { allocateDocumentNumber, formatDocumentNumber } from '@/lib/documentNumber'

describe('documentNumber', () => {
  it('formate avec préfixe, année et séquence sur 4 chiffres', () => {
    expect(formatDocumentNumber('devis', 2026, 1)).toBe('DEV-2026-0001')
    expect(formatDocumentNumber('facture', 2026, 42)).toBe('FACT-2026-0042')
    expect(formatDocumentNumber('facture', 2026, 12345)).toBe('FACT-2026-12345')
  })

  it('attribue des numéros consécutifs sans jamais réutiliser', () => {
    const a = allocateDocumentNumber({}, 'devis', '2026-03-01T10:00:00.000Z')
    const b = allocateDocumentNumber(a.counters, 'devis', '2026-09-01T10:00:00.000Z')
    expect([a.number, b.number]).toEqual(['DEV-2026-0001', 'DEV-2026-0002'])
  })

  it('les séquences des devis et des factures sont indépendantes', () => {
    const devis = allocateDocumentNumber({}, 'devis', '2026-03-01T00:00:00.000Z')
    const facture = allocateDocumentNumber(devis.counters, 'facture', '2026-03-01T00:00:00.000Z')
    expect(facture.number).toBe('FACT-2026-0001')
  })

  it("repart à 0001 au changement d'année, sans toucher l'année précédente", () => {
    const y26 = allocateDocumentNumber({}, 'facture', '2026-12-31T00:00:00.000Z')
    const y27 = allocateDocumentNumber(y26.counters, 'facture', '2027-01-02T00:00:00.000Z')
    expect(y27.number).toBe('FACT-2027-0001')
    expect(y27.counters['facture:2026']).toBe(1)
  })

  it("ne modifie pas l'objet de compteurs reçu", () => {
    const counters = { 'devis:2026': 3 }
    allocateDocumentNumber(counters, 'devis', '2026-01-01T00:00:00.000Z')
    expect(counters).toEqual({ 'devis:2026': 3 })
  })

  it('reprend après un compteur existant', () => {
    expect(allocateDocumentNumber({ 'devis:2026': 7 }, 'devis', '2026-05-05T00:00:00.000Z').number).toBe('DEV-2026-0008')
  })
})
