import { forwardRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, Copy, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_NOTE_COLOR } from '@/features/moodboard/colors'
import type { EquipmentItem, MoodboardItem, WeddingDesign } from '@/types/entities'

const KIND_LABELS: Record<MoodboardItem['kind'], string> = {
  image: 'Image',
  texte: 'Texte',
  couleur: 'Couleur',
  matiere: 'Matière',
}

const NO_EQUIPMENT = 'aucun'

interface MoodboardInspectorProps {
  item: MoodboardItem
  palette: WeddingDesign['palette']
  equipment: EquipmentItem[]
  /** `commit: false` = aperçu pendant la frappe ; l'enregistrement se fait au départ du champ. */
  onChange: (patch: Partial<MoodboardItem>, options: { commit: boolean; coalesceKey?: string }) => void
  onBringToFront: () => void
  onSendToBack: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

/** Panneau de droite : réglages de l'élément sélectionné. */
export const MoodboardInspector = forwardRef<HTMLTextAreaElement, MoodboardInspectorProps>(function MoodboardInspector(
  { item, palette, equipment, onChange, onBringToFront, onSendToBack, onDuplicate, onDelete, onClose },
  textRef,
) {
  // Texte en cours de frappe : affiché tout de suite, enregistré au départ du champ (une seule étape d'annulation).
  const [draftText, setDraftText] = useState(item.text ?? '')
  const hasText = item.kind !== 'image'
  const color = item.color ?? (item.kind === 'matiere' ? DEFAULT_NOTE_COLOR : item.kind === 'couleur' ? '#A9B08F' : undefined)
  const textLabel = item.kind === 'couleur' ? 'Nom de la couleur' : item.kind === 'matiere' ? 'Nom de la matière' : 'Texte'

  const setColor = (hex: string | undefined) => onChange({ color: hex }, { commit: true, coalesceKey: `color:${item.id}` })

  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-72 flex-col gap-5 overflow-y-auto border-l border-border bg-card p-4 shadow-[-8px_0_24px_-16px_rgb(31_45_61/0.35)]" aria-label="Élément sélectionné">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{KIND_LABELS[item.kind]}</p>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer le panneau">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {hasText && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mb-text" className="text-xs font-medium text-muted-foreground">
            {textLabel}
          </label>
          <Textarea
            id="mb-text"
            ref={textRef}
            rows={item.kind === 'texte' ? 4 : 2}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value)
              onChange({ text: e.target.value }, { commit: false })
            }}
            onBlur={() => onChange({ text: draftText || undefined }, { commit: true })}
          />
        </div>
      )}

      {hasText && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{item.kind === 'texte' ? 'Fond' : item.kind === 'matiere' ? 'Teinte' : 'Couleur'}</p>
          <div className="flex flex-wrap items-center gap-2">
            {item.kind === 'texte' && (
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className="h-8 rounded-full border border-border px-3 text-xs text-foreground data-[active=true]:ring-2 data-[active=true]:ring-ring"
                data-active={!item.color}
              >
                Aucun
              </button>
            )}
            {palette.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setColor(swatch.hex)}
                className="size-8 rounded-full border border-border data-[active=true]:ring-2 data-[active=true]:ring-ring data-[active=true]:ring-offset-2"
                style={{ backgroundColor: swatch.hex }}
                data-active={item.color?.toUpperCase() === swatch.hex.toUpperCase()}
                aria-label={`Couleur ${swatch.label ?? swatch.hex}`}
                title={swatch.label ?? swatch.hex}
              />
            ))}
            <label
              className="relative size-8 cursor-pointer overflow-hidden rounded-full border border-dashed border-foreground/30"
              style={{ backgroundColor: color }}
              title="Autre couleur"
            >
              <span className="sr-only">Autre couleur</span>
              <input
                type="color"
                value={color ?? '#FFFFFF'}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}

      {equipment.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Lié au matériel</p>
          <Select
            value={item.equipmentItemId ?? NO_EQUIPMENT}
            onValueChange={(v) => onChange({ equipmentItemId: v === NO_EQUIPMENT ? undefined : v }, { commit: true })}
          >
            <SelectTrigger aria-label="Lier à un élément du matériel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_EQUIPMENT}>Aucun</SelectItem>
              {equipment.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  {e.quantity > 1 ? ` ×${e.quantity}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        Astuces : Maj en redimensionnant libère les proportions ; Maj en tournant fait des crans de 15°. ⌘Z annule, ⌘D duplique, Suppr efface.
      </p>
    </aside>
  )
})
