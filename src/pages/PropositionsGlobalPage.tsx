import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { FilterPills, type FilterOption } from '@/components/FilterPills'
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { ProposalStatus } from '@/types/entities'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

type FilterKey = 'toutes' | ProposalStatus

const FILTERS: FilterOption<FilterKey>[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'brouillon', label: 'Brouillon' },
  { key: 'a_envoyer', label: 'À envoyer' },
  { key: 'envoyee', label: 'Envoyées' },
  { key: 'en_attente_approbation', label: "En attente d'approbation" },
  { key: 'approuvee', label: 'Approuvées' },
  { key: 'rejetee', label: 'Rejetées' },
  { key: 'expiree', label: 'Expirées' },
]

export function PropositionsGlobalPage() {
  const proposals = useWorkspaceStore((s) => s.workspace.proposals)
  const weddings = useWorkspaceStore((s) => s.workspace.weddings)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)

  const [filter, setFilter] = useState<FilterKey>('toutes')

  const weddingById = useMemo(() => new Map(weddings.map((w) => [w.id, w])), [weddings])
  const templateLabelByTier = useMemo(() => new Map(proposalTemplates.map((t) => [t.tier, t.label])), [proposalTemplates])

  const rows = useMemo(() => {
    return proposals
      .filter((p) => (filter === 'toutes' ? true : p.status === filter))
      .map((p) => ({ proposal: p, wedding: weddingById.get(p.weddingId) }))
      .sort((a, b) => b.proposal.updatedAt.localeCompare(a.proposal.updatedAt))
  }, [proposals, weddingById, filter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Propositions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toutes vos propositions, tous mariages confondus.</p>
      </div>

      <FilterPills options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filtrer les propositions" />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Aucune proposition ne correspond à ce filtre.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map(({ proposal, wedding }) => (
            <Link
              key={proposal.id}
              to={wedding ? `/mariages/${wedding.id}/documents/propositions/${proposal.id}` : '#'}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-thread/50"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium text-foreground">{proposal.title}</p>
                <p className="text-xs uppercase tracking-wide text-thread">{templateLabelByTier.get(proposal.template) ?? proposal.template}</p>
              </div>
              <span className="text-muted-foreground">{wedding ? wedding.coupleName : 'Mariage supprimé'}</span>
              <ProposalStatusBadge status={proposal.status} />
              <span className="font-medium tabular-nums text-foreground">{currency.format(proposal.total)}</span>
              <span className="text-xs text-muted-foreground">Mis à jour le {format(new Date(proposal.updatedAt), 'd MMM yyyy', { locale: fr })}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
