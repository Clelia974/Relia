import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/EmptyState'
import { VendorFilters, type VendorFilterOption } from '@/features/vendors/components/VendorFilters'
import { VendorStatusBadge } from '@/features/vendors/components/VendorStatusBadge'
import { currency } from '@/lib/currency'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { VendorStatus } from '@/types/entities'

type FilterKey = 'tous' | VendorStatus

const FILTERS: VendorFilterOption<FilterKey>[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_contacter', label: 'À contacter' },
  { key: 'contacte', label: 'Contactés' },
  { key: 'confirme', label: 'Confirmés' },
  { key: 'acompte_paye', label: 'Acompte payé' },
  { key: 'solde_a_payer', label: 'Solde à payer' },
]

export function PrestatairesGlobalPage() {
  const vendors = useWorkspaceStore((s) => s.workspace.vendors)
  const vendorWeddingLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const weddings = useWorkspaceStore((s) => s.workspace.weddings)

  const [filter, setFilter] = useState<FilterKey>('tous')
  const [query, setQuery] = useState('')

  const weddingNameById = useMemo(() => new Map(weddings.map((w) => [w.id, w.coupleName])), [weddings])
  const weddingName = (weddingId: string) => weddingNameById.get(weddingId) ?? '—'

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vendors
      .flatMap((vendor) => (vendor.weddingIds.length > 0 ? vendor.weddingIds : [null]).map((weddingId) => ({ vendor, weddingId })))
      .filter(({ vendor }) => (filter === 'tous' ? true : vendor.status === filter))
      .filter(({ vendor, weddingId }) => {
        if (!q) return true
        const couple = weddingId ? (weddingNameById.get(weddingId) ?? '').toLowerCase() : ''
        return (
          vendor.name.toLowerCase().includes(q) ||
          (vendor.company ?? '').toLowerCase().includes(q) ||
          vendor.category.toLowerCase().includes(q) ||
          couple.includes(q)
        )
      })
  }, [vendors, weddingNameById, filter, query])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Prestataires</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tous vos prestataires, tous mariages confondus.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <VendorFilters options={FILTERS} value={filter} onChange={setFilter} />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, entreprise, couple, catégorie…"
            className="pl-8"
            aria-label="Rechercher un prestataire"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState description="Aucun prestataire ne correspond à votre recherche." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map(({ vendor, weddingId }) => (
            <div
              key={`${vendor.id}-${weddingId ?? 'sans-mariage'}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium text-foreground">{vendor.name}</p>
                {vendor.company && <p className="text-xs text-muted-foreground">{vendor.company}</p>}
              </div>
              {weddingId ? (
                <Link to={`/mariages/${weddingId}/prestataires`} className="text-foreground hover:underline">
                  {weddingName(weddingId)}
                </Link>
              ) : (
                <span className="text-muted-foreground">Sans mariage</span>
              )}
              <span className="text-muted-foreground">{vendor.category}</span>
              <VendorStatusBadge status={vendor.status} />
              <span className="text-muted-foreground">{vendor.arrivalTime ?? 'Horaire non renseigné'}</span>
              <span className="text-muted-foreground">
                {(() => {
                  const link = weddingId
                    ? vendorWeddingLinks.find((l) => l.vendorId === vendor.id && l.weddingId === weddingId)
                    : undefined
                  return link?.estimatedCost !== undefined ? currency.format(link.estimatedCost) : 'Coût non renseigné'
                })()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
