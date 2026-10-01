import { useState } from 'react'
import { Check, ChevronDown, Copy, FilePlus, LayoutGrid, Monitor, Pencil, Trash2 } from 'lucide-react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { FloorPlanEditor, type FloorPlanMode } from '@/features/floorplan/components/FloorPlanEditor'
import { FloorPlanStatic } from '@/features/floorplan/components/FloorPlanStatic'
import { guestsByTable } from '@/features/floorplan/floorPlanOps'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { FloorPlan } from '@/types/entities'

type VersionDialog = { mode: 'copy' | 'empty' | 'rename'; plan: FloorPlan } | null

function VersionTitleDialog({ state, onClose, onSubmit }: { state: VersionDialog; onClose: () => void; onSubmit: (title: string) => void }) {
  const [title, setTitle] = useState(state?.mode === 'rename' ? state.plan.title : state?.mode === 'copy' ? `${state.plan.title} (copie)` : '')
  const heading = state?.mode === 'rename' ? 'Renommer la version' : state?.mode === 'copy' ? 'Copier cette version' : 'Nouvelle version vide'
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            {state?.mode === 'copy'
              ? 'La copie reprend les tables et le placement des invités — idéal pour tester une variante (pluie, autre salle…).'
              : 'Par exemple « Principal », « Version pluie », « Salle du haut ».'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (title.trim()) onSubmit(title.trim())
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Nom de la version" autoFocus />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {state?.mode === 'rename' ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Plan de salle + plan de table d'un mariage, avec plusieurs versions possibles. */
export function WeddingFloorPlanTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allPlans = useWorkspaceStore((s) => s.workspace.floorPlans)
  const allGuests = useWorkspaceStore((s) => s.workspace.guests)
  const createFloorPlan = useWorkspaceStore((s) => s.createFloorPlan)
  const duplicateFloorPlan = useWorkspaceStore((s) => s.duplicateFloorPlan)
  const renameFloorPlan = useWorkspaceStore((s) => s.renameFloorPlan)
  const deleteFloorPlan = useWorkspaceStore((s) => s.deleteFloorPlan)
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const [dialog, setDialog] = useState<VersionDialog>(null)
  const [pendingDelete, setPendingDelete] = useState<FloorPlan | null>(null)

  const plans = allPlans.filter((p) => p.weddingId === wedding.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const guests = allGuests.filter((g) => g.weddingId === wedding.id)
  const plan = plans.find((p) => p.id === params.get('version')) ?? plans[0]
  const mode: FloorPlanMode = params.get('mode') === 'placement' ? 'placement' : 'disposition'

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set(key, value)
        return next
      },
      { replace: true },
    )

  const handleDialogSubmit = (title: string) => {
    if (!dialog) return
    if (dialog.mode === 'rename') {
      renameFloorPlan(dialog.plan.id, title)
    } else {
      const id = dialog.mode === 'copy' ? duplicateFloorPlan(dialog.plan.id, title) : createFloorPlan(wedding.id, title)
      if (id) setParam('version', id)
      toast.success('Version créée.')
    }
    setDialog(null)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteFloorPlan(pendingDelete.id)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('version')
      return next
    })
    setPendingDelete(null)
    toast.success('Version supprimée.')
  }

  if (!plan) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Plan de salle & tables</h1>
          <p className="mt-1 text-sm text-muted-foreground">Disposez librement la salle, puis placez chaque invité à sa table.</p>
        </div>
        <button
          type="button"
          onClick={() => setParam('version', createFloorPlan(wedding.id, 'Principal'))}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-16 text-center transition-colors hover:border-foreground/30"
        >
          <LayoutGrid className="size-8 text-muted-foreground" aria-hidden="true" />
          <span className="font-heading text-lg text-foreground">Commencer le plan</span>
          <span className="max-w-md text-sm text-muted-foreground">
            Tables rondes ou rectangulaires, table d'honneur, piste de danse, bar… posez-les où vous voulez, sans plan d'architecte.
          </span>
        </button>
      </div>
    )
  }

  const versionPicker = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-56 shrink-0 font-heading text-base font-semibold">
          <span className="truncate">{plan.title}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
        <DropdownMenuLabel>Versions du plan</DropdownMenuLabel>
        {plans.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => setParam('version', p.id)}>
            <Check className={p.id === plan.id ? 'size-4' : 'size-4 opacity-0'} aria-hidden="true" />
            {p.title}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setDialog({ mode: 'copy', plan })}>
          <Copy className="size-4" aria-hidden="true" />
          Copier cette version
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog({ mode: 'empty', plan })}>
          <FilePlus className="size-4" aria-hidden="true" />
          Nouvelle version vide
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog({ mode: 'rename', plan })}>
          <Pencil className="size-4" aria-hidden="true" />
          Renommer
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(plan)}>
          <Trash2 className="size-4" aria-hidden="true" />
          Supprimer cette version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      {isDesktop ? (
        <FloorPlanEditor
          key={plan.id}
          wedding={wedding}
          plan={plan}
          guests={guests}
          mode={mode}
          onModeChange={(m) => setParam('mode', m)}
          versionPicker={versionPicker}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">{versionPicker}</div>
          <div className="overflow-hidden rounded-lg border border-border">
            <FloorPlanStatic plan={plan} guests={guests} />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="size-4 shrink-0" aria-hidden="true" />
            Ouvrez SilkyPlace sur ordinateur pour modifier le plan.
          </p>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Qui est assis où</h2>
            {guestsByTable(plan.elements, plan.assignments, guests).map(({ table, guests: seated }) => (
              <div key={table.id} className="rounded-lg border border-border bg-card p-3">
                <p className="font-medium text-foreground">
                  {table.label ?? 'Table'}{' '}
                  <span className="text-sm font-normal tabular-nums text-muted-foreground">
                    {seated.length}/{table.seats ?? 0}
                  </span>
                </p>
                {seated.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{seated.map((g) => g.name).join(', ')}</p>}
              </div>
            ))}
          </section>
        </div>
      )}

      <VersionTitleDialog
        key={dialog ? `${dialog.mode}:${dialog.plan.id}` : 'closed'}
        state={dialog}
        onClose={() => setDialog(null)}
        onSubmit={handleDialogSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la version « {pendingDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ses tables et son placement seront supprimés. La liste des invités, elle, est conservée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
