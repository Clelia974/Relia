import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TagListEditorProps {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
}

/** Liste de mots (style, matières) : on tape, Entrée ajoute, la croix retire. Aucun doublon (insensible à la casse). */
export function TagListEditor({ label, placeholder, values, onChange, disabled }: TagListEditorProps) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    if (!values.some((v) => v.toLowerCase() === value.toLowerCase())) onChange([...values, value])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => (
            <li key={value} className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pl-3.5 pr-1.5 text-sm text-foreground">
              {value}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(values.filter((v) => v !== value))}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label={`Retirer « ${value} »`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder={placeholder}
            aria-label={`Ajouter — ${label}`}
          />
          <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter
          </Button>
        </div>
      )}
    </div>
  )
}
