import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { WeddingDesign } from '@/types/entities'

type Swatch = WeddingDesign['palette'][number]

interface PaletteEditorProps {
  palette: Swatch[]
  onChange: (palette: Swatch[]) => void
  disabled?: boolean
}

/** Palette du mariage : pastilles de couleur avec un nom facultatif (« terracotta », « vert sauge »…). */
export function PaletteEditor({ palette, onChange, disabled }: PaletteEditorProps) {
  const [hex, setHex] = useState('#A9B08F')
  const [label, setLabel] = useState('')

  const add = () => {
    const normalized = hex.toUpperCase()
    if (palette.some((s) => s.hex.toUpperCase() === normalized)) return
    onChange([...palette, { hex: normalized, ...(label.trim() ? { label: label.trim() } : {}) }])
    setLabel('')
  }

  return (
    <div className="flex flex-col gap-4">
      {palette.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="Palette">
          {palette.map((swatch) => (
            <li key={swatch.hex} className="group relative flex w-20 flex-col items-center gap-1.5">
              <span className="size-16 rounded-2xl border border-border shadow-(--shadow-card)" style={{ backgroundColor: swatch.hex }} />
              <span className="w-full truncate text-center text-xs text-foreground">{swatch.label ?? swatch.hex}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(palette.filter((s) => s.hex !== swatch.hex))}
                  className="absolute -right-1 -top-1 rounded-full border border-border bg-card p-0.5 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Retirer la couleur ${swatch.label ?? swatch.hex}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border" style={{ backgroundColor: hex }}>
            <span className="sr-only">Choisir une couleur</span>
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder="Nom (facultatif) — ex. terracotta"
            className="max-w-xs"
            aria-label="Nom de la couleur"
          />
          <Button type="button" variant="outline" onClick={add}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter la couleur
          </Button>
        </div>
      )}
    </div>
  )
}
