import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/EmptyState'
import { FilterPills } from '@/components/FilterPills'
import { MariageCard } from '@/features/weddings/components/MariageCard'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Wedding } from '@/types/entities'

type FilterKey = 'tous' | 'en_preparation' | 'actifs' | 'termines' | 'archives'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'en_preparation', label: 'En préparation' },
  { key: 'actifs', label: 'Actifs' },
  { key: 'termines', label: 'Terminés' },
  { key: 'archives', label: 'Archivés' },
]

function matchesFilter(wedding: Wedding, filter: FilterKey): boolean {
  if (filter === 'archives') return wedding.archived
  if (wedding.archived) return false
  switch (filter) {
    case 'tous':
      return true
    case 'en_preparation':
      return wedding.status === 'en_preparation'
    case 'actifs':
      return wedding.status !== 'termine' && wedding.status !== 'annule'
    case 'termines':
      return wedding.status === 'termine'
    default:
      return true
  }
}

export function MariagesListPage() {
  const weddings = useWorkspaceStore((s) => s.workspace.weddings)
  const archiveWedding = useWorkspaceStore((s) => s.archiveWedding)
  const updateWedding = useWorkspaceStore((s) => s.updateWedding)
  const deleteWedding = useWorkspaceStore((s) => s.deleteWedding)

  const [filter, setFilter] = useState<FilterKey>('tous')
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Wedding | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return weddings
      .filter((w) => matchesFilter(w, filter))
      .filter((w) => (q ? w.coupleName.toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [weddings, filter, query])

  const handleArchive = (id: string) => {
    archiveWedding(id)
    toast.success('Mariage archivé.')
  }
  const handleUnarchive = (id: string) => {
    updateWedding(id, { archived: false })
    toast.success('Mariage désarchivé.')
  }
  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteWedding(pendingDelete.id)
    setPendingDelete(null)
    toast.success('Mariage supprimé.')
  }

  if (weddings.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-6 py-16">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Votre espace est prêt.</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Commencez par créer votre premier mariage pour organiser vos prestataires, vos tâches et votre planning au
            même endroit.
          </p>
        </div>
        <Button asChild>
          <Link to="/mariages/nouveau">
            <Plus className="size-4" aria-hidden="true" />
            Créer mon premier mariage
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Mariages</h1>
        <Button asChild>
          <Link to="/mariages/nouveau">
            <Plus className="size-4" aria-hidden="true" />
            Créer un mariage
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Filtrer les mariages" />

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un couple…"
            className="pl-8"
            aria-label="Rechercher un mariage par nom du couple"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState description="Aucun mariage ne correspond à votre recherche." />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((wedding) => (
            <MariageCard
              key={wedding.id}
              wedding={wedding}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {pendingDelete?.coupleName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce mariage et toutes les données qui lui sont rattachées (tâches, planning, finances) seront
              définitivement supprimés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
