import { useMemo, useState } from 'react'
import { ClipboardPaste, Pencil, Search, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GUEST_DRAG_TYPE } from '@/features/floorplan/dnd'
import { initials } from '@/features/floorplan/floorPlanGeometry'
import { parseGuestLines } from '@/features/floorplan/floorPlanOps'
import { PLAN_COLORS } from '@/features/floorplan/floorPlanStyle'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { FloorElement, Guest, SeatAssignment } from '@/types/entities'

const NO_GROUP = 'Sans groupe'

interface GuestPanelProps {
  weddingId: string
  guests: Guest[]
  assignments: SeatAssignment[]
  elements: FloorElement[]
  stats: { total: number; filled: number; unplaced: number }
  selectedGuestId: string | null
  onSelectGuest: (guestId: string | null) => void
  onUnassign: (guestId: string) => void
}

function GuestEditDialog({ guest, groups, onClose }: { guest: Guest | null; groups: string[]; onClose: () => void }) {
  const updateGuest = useWorkspaceStore((s) => s.updateGuest)
  const deleteGuest = useWorkspaceStore((s) => s.deleteGuest)
  const [name, setName] = useState(guest?.name ?? '')
  const [group, setGroup] = useState(guest?.group ?? '')
  const [notes, setNotes] = useState(guest?.notes ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Dialog open={guest !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'invité</DialogTitle>
          <DialogDescription>Le groupe sert à retrouver vite les invités (famille, amis, collègues…).</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!guest || !name.trim()) return
            updateGuest(guest.id, { name: name.trim(), group: group.trim() || undefined, notes: notes.trim() || undefined })
            onClose()
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nom" placeholder="Nom" autoFocus />
          <Input value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Groupe" placeholder="Groupe (facultatif)" list="guest-groups-edit" />
          <datalist id="guest-groups-edit">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes" placeholder="Régime, allergie, enfant, mobilité réduite…" rows={2} />
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (!guest) return
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                deleteGuest(guest.id)
                toast.success('Invité supprimé.')
                onClose()
              }}
            >
              {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PasteGuestsDialog({ open, weddingId, onClose }: { open: boolean; weddingId: string; onClose: () => void }) {
  const addGuests = useWorkspaceStore((s) => s.addGuests)
  const [text, setText] = useState('')
  const parsed = parseGuestLines(text)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Coller une liste d'invités</DialogTitle>
          <DialogDescription>
            Un invité par ligne, depuis Excel, un e-mail ou vos notes. Pour indiquer le groupe : « Nom ; Groupe » (ou deux colonnes copiées d'Excel).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          aria-label="Liste d'invités"
          placeholder={'Camille Martin ; Famille de Camille\nAntoine Durand ; Témoins\nLina Roux'}
          autoFocus
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={parsed.length === 0}
            onClick={() => {
              addGuests(weddingId, parsed)
              toast.success(`${parsed.length} invité${parsed.length > 1 ? 's' : ''} ajouté${parsed.length > 1 ? 's' : ''}.`)
              setText('')
              onClose()
            }}
          >
            Ajouter {parsed.length > 0 ? `${parsed.length} invité${parsed.length > 1 ? 's' : ''}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Liste des invités (mode placement) : non placés d'abord, regroupés par
 * groupe ; on glisse un invité sur une place, ou on le sélectionne puis on
 * clique une place. Déposer un invité ici le retire de sa place.
 */
export function GuestPanel({ weddingId, guests, assignments, elements, stats, selectedGuestId, onSelectGuest, onUnassign }: GuestPanelProps) {
  const addGuests = useWorkspaceStore((s) => s.addGuests)
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [editing, setEditing] = useState<Guest | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  const seatOf = useMemo(() => new Map(assignments.map((a) => [a.guestId, a])), [assignments])
  const tableLabel = useMemo(() => new Map(elements.map((e) => [e.id, e.label ?? 'Table'])), [elements])
  const groups = useMemo(() => [...new Set(guests.map((g) => g.group).filter((g): g is string => Boolean(g)))].sort((a, b) => a.localeCompare(b, 'fr')), [guests])

  const q = query.trim().toLowerCase()
  const visible = guests.filter((g) => !q || g.name.toLowerCase().includes(q) || g.group?.toLowerCase().includes(q))
  const unplaced = visible.filter((g) => !seatOf.has(g.id))
  const placed = visible.filter((g) => seatOf.has(g.id)).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const unplacedByGroup = new Map<string, Guest[]>()
  for (const g of [...unplaced].sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
    const key = g.group ?? NO_GROUP
    unplacedByGroup.set(key, [...(unplacedByGroup.get(key) ?? []), g])
  }
  const groupOrder = [...unplacedByGroup.keys()].sort((a, b) => (a === NO_GROUP ? 1 : b === NO_GROUP ? -1 : a.localeCompare(b, 'fr')))

  const addOne = () => {
    if (!name.trim()) return
    addGuests(weddingId, [{ name: name.trim(), ...(group.trim() ? { group: group.trim() } : {}) }])
    setName('')
  }

  const renderGuest = (g: Guest) => {
    const a = seatOf.get(g.id)
    const selected = g.id === selectedGuestId
    return (
      <li key={g.id}>
        <div
          role="button"
          tabIndex={0}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(GUEST_DRAG_TYPE, g.id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onClick={() => onSelectGuest(selected ? null : g.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectGuest(selected ? null : g.id)
            }
          }}
          className={cn(
            'group flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent active:cursor-grabbing',
            selected && 'bg-accent ring-1 ring-ring',
          )}
          title={g.notes}
        >
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
            style={a ? { backgroundColor: PLAN_COLORS.seatFilled, color: PLAN_COLORS.seatFilledText } : { border: `1.5px solid ${PLAN_COLORS.stroke}` }}
            aria-hidden="true"
          >
            {initials(g.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-foreground">{g.name}</span>
            {a && <span className="block truncate text-xs text-muted-foreground">{tableLabel.get(a.elementId)}</span>}
            {!a && g.notes && <span className="block truncate text-xs text-muted-foreground">{g.notes}</span>}
          </span>
          {a && (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
              aria-label={`Retirer ${g.name} de sa place`}
              title="Retirer de sa place"
              onClick={(e) => {
                e.stopPropagation()
                onUnassign(g.id)
              }}
            >
              <UserMinus className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label={`Modifier ${g.name}`}
            onClick={(e) => {
              e.stopPropagation()
              setEditing(g)
            }}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </li>
    )
  }

  return (
    <aside
      className={cn('flex w-72 shrink-0 flex-col border-r border-border bg-card', isDropTarget && 'bg-accent/60')}
      aria-label="Invités"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(GUEST_DRAG_TYPE)) {
          e.preventDefault()
          setIsDropTarget(true)
        }
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        setIsDropTarget(false)
        const guestId = e.dataTransfer.getData(GUEST_DRAG_TYPE)
        if (guestId && seatOf.has(guestId)) {
          e.preventDefault()
          onUnassign(guestId)
        }
      }}
    >
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <p className="text-sm text-foreground">
          <span className="font-semibold tabular-nums">
            {stats.filled}/{stats.total}
          </span>{' '}
          places · <span className="tabular-nums">{stats.unplaced}</span> non placé{stats.unplaced > 1 ? 's' : ''}
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addOne()
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'invité" aria-label="Nom de l'invité" />
          <div className="flex gap-2">
            <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Groupe (facultatif)" aria-label="Groupe de l'invité" list="guest-groups" />
            <Button type="submit" size="icon" variant="outline" disabled={!name.trim()} aria-label="Ajouter l'invité">
              <UserPlus className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <datalist id="guest-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </form>
        <Button variant="ghost" size="sm" className="justify-start" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste className="size-4" aria-hidden="true" />
          Coller une liste
        </Button>
        {guests.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un invité" className="pl-8" />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {guests.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Ajoutez vos invités ici, un par un ou en collant une liste.</p>
        ) : (
          <>
            {selectedGuestId && <p className="px-2 pb-2 text-xs text-muted-foreground">Cliquez sur une place pour y asseoir l'invité sélectionné.</p>}
            <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Non placés ({unplaced.length})</p>
            {unplaced.length === 0 && <p className="px-2 pb-2 text-sm text-muted-foreground">Tout le monde a une place.</p>}
            {groupOrder.map((key) => (
              <div key={key} className="pb-2">
                <p className="px-2 pt-1 text-xs text-muted-foreground">{key}</p>
                <ul>{unplacedByGroup.get(key)?.map(renderGuest)}</ul>
              </div>
            ))}
            {placed.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placés ({placed.length})</p>
                <ul>{placed.map(renderGuest)}</ul>
              </>
            )}
          </>
        )}
      </div>

      <GuestEditDialog key={editing?.id ?? 'none'} guest={editing} groups={groups} onClose={() => setEditing(null)} />
      <PasteGuestsDialog open={pasteOpen} weddingId={weddingId} onClose={() => setPasteOpen(false)} />
    </aside>
  )
}
