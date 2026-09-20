import type { Workspace } from '@/types/entities'

export type SearchResultKind = 'mariage' | 'prestataire' | 'devis' | 'facture' | 'tache'

export interface SearchResult {
  id: string
  kind: SearchResultKind
  title: string
  subtitle?: string
  href: string
}

export const SEARCH_KIND_LABELS: Record<SearchResultKind, string> = {
  mariage: 'Mariages',
  prestataire: 'Prestataires',
  devis: 'Devis',
  facture: 'Factures',
  tache: 'Tâches',
}

const KIND_ORDER: SearchResultKind[] = ['mariage', 'prestataire', 'devis', 'facture', 'tache']
const MAX_PER_KIND = 5

/** Minuscules sans accents : « Élodie » se trouve en tapant « elodie ». */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

type SearchableWorkspace = Pick<Workspace, 'weddings' | 'vendors' | 'proposals' | 'invoices' | 'tasks'>

interface Candidate extends SearchResult {
  haystack: string
}

function buildCandidates(ws: SearchableWorkspace): Candidate[] {
  const weddingName = new Map(ws.weddings.map((w) => [w.id, w.coupleName]))
  const candidates: Candidate[] = []

  for (const w of ws.weddings) {
    candidates.push({
      id: w.id,
      kind: 'mariage',
      title: w.coupleName,
      subtitle: w.venue || undefined,
      href: `/mariages/${w.id}`,
      haystack: `${w.coupleName} ${w.venue}`,
    })
  }
  for (const v of ws.vendors) {
    candidates.push({
      id: v.id,
      kind: 'prestataire',
      title: v.name,
      subtitle: [v.company, v.category].filter(Boolean).join(' · '),
      href: `/prestataires?fiche=${v.id}`,
      haystack: `${v.name} ${v.company ?? ''} ${v.category} ${v.email ?? ''} ${v.phone ?? ''}`,
    })
  }
  for (const p of ws.proposals) {
    candidates.push({
      id: p.id,
      kind: 'devis',
      title: `${p.proposalNumber} — ${p.title}`,
      subtitle: weddingName.get(p.weddingId),
      href: `/mariages/${p.weddingId}/documents/propositions/${p.id}`,
      haystack: `${p.proposalNumber} ${p.title} ${p.clientName} ${weddingName.get(p.weddingId) ?? ''}`,
    })
  }
  for (const i of ws.invoices) {
    candidates.push({
      id: i.id,
      kind: 'facture',
      title: `Facture ${i.invoiceNumber}`,
      subtitle: [i.clientName, weddingName.get(i.weddingId)].filter(Boolean).join(' · ') || undefined,
      href: `/mariages/${i.weddingId}/documents/factures/${i.id}`,
      haystack: `${i.invoiceNumber} ${i.clientName} ${weddingName.get(i.weddingId) ?? ''}`,
    })
  }
  for (const t of ws.tasks) {
    candidates.push({
      id: t.id,
      kind: 'tache',
      title: t.title,
      subtitle: t.weddingId ? weddingName.get(t.weddingId) : undefined,
      href: t.weddingId ? `/mariages/${t.weddingId}/taches` : '/taches',
      haystack: `${t.title} ${t.weddingId ? (weddingName.get(t.weddingId) ?? '') : ''}`,
    })
  }
  return candidates
}

/**
 * Recherche globale : chaque mot saisi doit apparaître (sans accents ni casse) dans l'élément.
 * Les correspondances au début du titre passent en premier ; 5 résultats maximum par type.
 */
export function searchWorkspace(ws: SearchableWorkspace, query: string): SearchResult[] {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  const scored: { result: SearchResult; startsWith: boolean }[] = []
  for (const candidate of buildCandidates(ws)) {
    const haystack = normalizeSearchText(candidate.haystack)
    if (!tokens.every((token) => haystack.includes(token))) continue
    const { haystack: _omit, ...result } = candidate
    scored.push({ result, startsWith: normalizeSearchText(candidate.title).startsWith(tokens[0]) })
  }

  return KIND_ORDER.flatMap((kind) =>
    scored
      .filter((s) => s.result.kind === kind)
      .sort((a, b) => Number(b.startsWith) - Number(a.startsWith))
      .slice(0, MAX_PER_KIND)
      .map((s) => s.result),
  )
}
