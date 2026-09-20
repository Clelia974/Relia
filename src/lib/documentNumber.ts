export type DocumentKind = 'devis' | 'facture'

export type DocumentCounters = Record<string, number>

const PREFIX: Record<DocumentKind, string> = { devis: 'DEV', facture: 'FACT' }

export function formatDocumentNumber(kind: DocumentKind, year: number, sequence: number): string {
  return `${PREFIX[kind]}-${year}-${String(sequence).padStart(4, '0')}`
}

/**
 * Attribue le prochain numéro d'un document : séquence continue par type et par année (DEV-2026-0001,
 * FACT-2026-0001…). Le compteur ne fait qu'augmenter — supprimer un document ne libère jamais son numéro.
 */
export function allocateDocumentNumber(
  counters: DocumentCounters,
  kind: DocumentKind,
  date: string | Date,
): { number: string; counters: DocumentCounters } {
  const year = typeof date === 'string' ? Number(date.slice(0, 4)) : date.getFullYear()
  const key = `${kind}:${year}`
  const sequence = (counters[key] ?? 0) + 1
  return { number: formatDocumentNumber(kind, year, sequence), counters: { ...counters, [key]: sequence } }
}
