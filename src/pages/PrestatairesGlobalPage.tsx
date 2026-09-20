import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddToWeddingDialog } from '@/features/vendors/components/AddToWeddingDialog'
import { VendorFilters, type VendorFilterOption } from '@/features/vendors/components/VendorFilters'
import { VendorForm } from '@/features/vendors/components/VendorForm'
import { VendorProfileDialog } from '@/features/vendors/components/VendorProfileDialog'
import { VendorStatusBadge } from '@/features/vendors/components/VendorStatusBadge'
import { getVendorAssignments } from '@/features/vendors/assignments'
import type { VendorFormValues } from '@/features/vendors/vendorForm.schema'
import { currency } from '@/lib/currency'
import { VENDOR_CATEGORIES } from '@/lib/vendorCategory'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Vendor, VendorCategory, VendorStatus } from '@/types/entities'

type FilterKey = 'tous' | VendorStatus
type ViewKey = 'catalogue' | 'affectations'

const ALL_CATEGORIES = 'toutes'

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
  const addVendor = useWorkspaceStore((s) => s.addVendor)
  const addVendorToWedding = useWorkspaceStore((s) => s.addVendorToWedding)

  const [view, setView] = useState<ViewKey>('catalogue')
  const [filter, setFilter] = useState<FilterKey>('tous')
  const [category, setCategory] = useState<string>(ALL_CATEGORIES)
  const [query, setQuery] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [openedProfileId, setOpenedProfileId] = useState<string | null>(null)
  /** La fiche peut s'ouvrir depuis la recherche globale (?fiche=…) ou depuis un bouton de la page. */
  const profileVendorId = searchParams.get('fiche') ?? openedProfileId
  const [creating, setCreating] = useState(false)
  const [addingTo, setAddingTo] = useState<Vendor | null>(null)

  const weddingNameById = useMemo(() => new Map(weddings.map((w) => [w.id, w.coupleName])), [weddings])
  const weddingName = (weddingId: string) => weddingNameById.get(weddingId) ?? '—'

  const q = query.trim().toLowerCase()

  const catalogRows = useMemo(
    () =>
      vendors
        .map((vendor) => ({ vendor, assignments: getVendorAssignments(vendor, vendorWeddingLinks) }))
        .filter(({ vendor }) => category === ALL_CATEGORIES || vendor.category === category)
        .filter(({ assignments }) => filter === 'tous' || assignments.some((a) => a.link.status === filter))
        .filter(({ vendor, assignments }) => {
          if (!q) return true
          const couples = assignments.map((a) => (weddingNameById.get(a.link.weddingId) ?? '').toLowerCase())
          return (
            vendor.name.toLowerCase().includes(q) ||
            (vendor.company ?? '').toLowerCase().includes(q) ||
            vendor.category.toLowerCase().includes(q) ||
            (vendor.email ?? '').toLowerCase().includes(q) ||
            (vendor.phone ?? '').toLowerCase().includes(q) ||
            couples.some((c) => c.includes(q))
          )
        }),
    [vendors, vendorWeddingLinks, weddingNameById, filter, category, q],
  )

  const assignmentRows = useMemo(
    () =>
      catalogRows.flatMap(({ vendor, assignments }) =>
        assignments
          .filter((a) => filter === 'tous' || a.link.status === filter)
          .filter((a) => !q || vendor.name.toLowerCase().includes(q) || (weddingNameById.get(a.link.weddingId) ?? '').toLowerCase().includes(q) || (vendor.company ?? '').toLowerCase().includes(q) || vendor.category.toLowerCase().includes(q) || (vendor.email ?? '').toLowerCase().includes(q) || (vendor.phone ?? '').toLowerCase().includes(q))
          .map((a) => ({ vendor, link: a.link })),
      ),
    [catalogRows, filter, q, weddingNameById],
  )

  const handleCreate = (values: VendorFormValues) => {
    addVendor({
      name: values.name.trim(),
      company: values.company.trim() || undefined,
      category: values.category as VendorCategory,
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      notes: values.notes.trim() || undefined,
      weddingIds: [],
    })
    toast.success('Prestataire ajouté au catalogue.')
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Prestataires</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tous vos prestataires, tous mariages confondus.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Nouveau prestataire
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)}>
        <TabsList aria-label="Vue des prestataires">
          <TabsTrigger value="catalogue">Tous les prestataires</TabsTrigger>
          <TabsTrigger value="affectations">Affectations par mariage</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <VendorFilters options={FILTERS} value={filter} onChange={setFilter} />
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par catégorie">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>Toutes les catégories</SelectItem>
              {VENDOR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {view === 'catalogue' ? (
        catalogRows.length === 0 ? (
          <EmptyState description="Aucun prestataire ne correspond à votre recherche." />
        ) : (
          <ul className="flex flex-col gap-2.5" aria-label="Catalogue des prestataires">
            {catalogRows.map(({ vendor, assignments }) => (
              <li
                key={vendor.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-medium text-foreground">{vendor.name}</p>
                  {vendor.company && <p className="text-xs text-muted-foreground">{vendor.company}</p>}
                </div>
                <span className="text-muted-foreground">{vendor.category}</span>
                <span className="min-w-32 text-muted-foreground">{vendor.phone ?? vendor.email ?? 'Aucune coordonnée'}</span>
                <span className="text-muted-foreground">
                  {assignments.length === 0
                    ? 'Aucun mariage'
                    : `${assignments.length} mariage${assignments.length > 1 ? 's' : ''}`}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpenedProfileId(vendor.id)}>
                    Voir la fiche
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingTo(vendor)}>
                    Ajouter à un mariage
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : assignmentRows.length === 0 ? (
        <EmptyState description="Aucune affectation ne correspond à votre recherche." />
      ) : (
        <ul className="flex flex-col gap-2.5" aria-label="Affectations par mariage">
          {assignmentRows.map(({ vendor, link }) => (
            <li
              key={`${vendor.id}-${link.weddingId}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <div className="min-w-40 flex-1">
                <button type="button" onClick={() => setOpenedProfileId(vendor.id)} className="font-medium text-foreground hover:underline">
                  {vendor.name}
                </button>
                {vendor.company && <p className="text-xs text-muted-foreground">{vendor.company}</p>}
              </div>
              <Link to={`/mariages/${link.weddingId}/prestataires`} className="text-foreground hover:underline">
                {weddingName(link.weddingId)}
              </Link>
              <span className="text-muted-foreground">{vendor.category}</span>
              <VendorStatusBadge status={link.status} />
              <span className="text-muted-foreground">{link.arrivalTime ?? 'Horaire non renseigné'}</span>
              <span className="text-muted-foreground">
                {link.estimatedCost !== undefined ? currency.format(link.estimatedCost) : 'Coût non renseigné'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <VendorProfileDialog
        vendorId={profileVendorId}
        onClose={() => {
          setOpenedProfileId(null)
          if (searchParams.has('fiche')) setSearchParams({}, { replace: true })
        }}
      />

      {creating && <VendorForm open onOpenChange={setCreating} onSubmit={handleCreate} />}

      {addingTo && (
        <AddToWeddingDialog
          vendor={addingTo}
          weddings={weddings}
          onOpenChange={(open) => !open && setAddingTo(null)}
          onConfirm={(weddingId) => {
            addVendorToWedding(addingTo.id, weddingId)
            toast.success(`${addingTo.name} ajouté à ${weddingName(weddingId)}.`)
            setAddingTo(null)
          }}
        />
      )}
    </div>
  )
}
