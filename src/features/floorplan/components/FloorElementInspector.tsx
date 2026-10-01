import { useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Copy, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ELEMENT_LABELS, isTable } from '@/features/floorplan/floorPlanGeometry'
import { ELEMENT_FILL } from '@/features/floorplan/floorPlanStyle'
import type { FloorElement, WeddingDesign } from '@/types/entities'

interface FloorElementInspectorProps {
  element: FloorElement
  /** Invités assis à cette table — prévient avant de réduire le nombre de places. */
  seatedCount: number
  palette: WeddingDesign['palette']
  onChange: (patch: Partial<FloorElement>, options: { commit: boolean; coalesceKey?: string }) => void
  onBringToFront: () => void
  onSendToBack: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

export function FloorElementInspector({
  element,
  seatedCount,
  palette,
  onChange,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onClose,
}: FloorElementInspectorProps) {
  const [label, setLabel] = useState(element.label ?? '')
  const [seats, setSeats] = useState(String(element.seats ?? ''))
  const table = isTable(element)
  const fill = element.color ?? ELEMENT_FILL[element.kind]

  const commitSeats = () => {
    const n = Math.round(Number(seats))
    if (!Number.isFinite(n) || n < 1 || n > 40) {
      setSeats(String(element.seats ?? ''))
      return
    }
    onChange({ seats: n }, { commit: true })
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-72 flex-col gap-5 overflow-y-auto border-l border-border bg-card p-4 shadow-[-8px_0_24px_-16px_rgb(31_45_61/0.35)]" aria-label="Élément sélectionné">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{ELEMENT_LABELS[element.kind]}</p>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer le panneau">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="fp-label" className="text-xs font-medium text-muted-foreground">
          Nom
        </label>
        <Input
          id="fp-label"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            onChange({ label: e.target.value }, { commit: false })
          }}
          onBlur={() => onChange({ label: label.trim() || undefined }, { commit: true })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder={table ? 'ex. Table 1, Les Oliviers…' : ELEMENT_LABELS[element.kind]}
        />
      </div>

      {table && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fp-seats" className="text-xs font-medium text-muted-foreground">
            Nombre de places
          </label>
          <Input
            id="fp-seats"
            type="number"
            min={1}
            max={40}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            onBlur={commitSeats}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-24"
          />
          {seatedCount > 0 && Number(seats) < (element.seats ?? 0) && (
            <p className="text-xs text-muted-foreground">Les invités assis sur les places retirées redeviendront « non placés ».</p>
          )}
        </div>
      )}

      {element.kind === 'contour' && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox checked={element.closed ?? false} onCheckedChange={(v) => onChange({ closed: v === true }, { commit: true })} />
          Forme fermée (contour de la salle)
        </label>
      )}

      {element.kind !== 'texte' && (element.kind !== 'contour' || element.closed) && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{element.kind === 'contour' ? 'Couleur du sol' : 'Couleur'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ color: undefined }, { commit: true })}
              className="h-8 rounded-full border border-border px-3 text-xs text-foreground data-[active=true]:ring-2 data-[active=true]:ring-ring"
              data-active={!element.color}
            >
              Par défaut
            </button>
            {palette.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => onChange({ color: swatch.hex }, { commit: true })}
                className="size-8 rounded-full border border-border data-[active=true]:ring-2 data-[active=true]:ring-ring data-[active=true]:ring-offset-2"
                style={{ backgroundColor: swatch.hex }}
                data-active={element.color?.toUpperCase() === swatch.hex.toUpperCase()}
                aria-label={`Couleur ${swatch.label ?? swatch.hex}`}
                title={swatch.label ?? swatch.hex}
              />
            ))}
            <label
              className="relative size-8 cursor-pointer overflow-hidden rounded-full border border-dashed border-foreground/30"
              style={{ backgroundColor: fill === 'transparent' ? undefined : fill }}
              title="Autre couleur"
            >
              <span className="sr-only">Autre couleur</span>
              <input
                type="color"
                value={fill === 'transparent' ? '#FFFFFF' : fill}
                onChange={(e) => onChange({ color: e.target.value.toUpperCase() }, { commit: true, coalesceKey: `color:${element.id}` })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Disposition</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onBringToFront}>
            <ArrowUpToLine className="size-4" aria-hidden="true" />
            Devant
          </Button>
          <Button variant="outline" size="sm" onClick={onSendToBack}>
            <ArrowDownToLine className="size-4" aria-hidden="true" />
            Derrière
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="size-4" aria-hidden="true" />
            Dupliquer
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer
          </Button>
        </div>
      </div>

      <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
        {element.kind === 'contour'
          ? 'Astuces : glissez un angle (rond) pour le déplacer — Maj : mur droit. Glissez le losange au milieu d’un mur pour l’arrondir, double-clic dessus pour le redresser. Double-clic sur un mur : ajoute un angle ; sur un angle : le retire. Les coins du cadre agrandissent toute la salle.'
          : 'Astuces : Maj en redimensionnant garde les proportions ; Maj en tournant fait des crans de 15°. ⌘D duplique (pratique pour aligner des tables identiques), Suppr efface.'}
      </p>
    </aside>
  )
}
