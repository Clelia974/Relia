import { type FormEvent, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateId } from '@/lib/id'
import type { TaskTemplateItem } from '@/types/entities'

type Direction = 'avant' | 'apres'

interface DraftItem {
  id: string
  title: string
  direction: Direction
  days: string
}

function toDraftItem(item: TaskTemplateItem): DraftItem {
  return {
    id: item.id,
    title: item.title,
    direction: item.dayOffset < 0 ? 'avant' : 'apres',
    days: String(Math.abs(item.dayOffset)),
  }
}

function emptyDraftItem(): DraftItem {
  return { id: generateId(), title: '', direction: 'avant', days: '7' }
}

interface TaskTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TaskTemplateItem[]
  onSubmit: (items: TaskTemplateItem[]) => void
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — même convention que ProposalTemplateForm. */
export function TaskTemplateForm({ open, onOpenChange, template, onSubmit }: TaskTemplateFormProps) {
  const [items, setItems] = useState<DraftItem[]>(() => template.map(toDraftItem))
  const [error, setError] = useState<string | null>(null)

  const setItemField = (id: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }
  const addItem = () => setItems((prev) => [...prev, emptyDraftItem()])
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    for (const item of items) {
      if (!item.title.trim()) {
        setError('Chaque étape doit avoir un titre.')
        return
      }
      const days = Number(item.days)
      if (!Number.isFinite(days) || days < 0 || !Number.isInteger(days)) {
        setError('Le nombre de jours doit être un entier positif ou nul.')
        return
      }
    }

    setError(null)
    onSubmit(
      items.map((i) => ({
        id: i.id,
        title: i.title.trim(),
        dayOffset: i.direction === 'avant' ? -Number(i.days) : Number(i.days),
      })),
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la checklist de démarrage</DialogTitle>
          <DialogDescription>
            Ces étapes sont ajoutées automatiquement à la création d'un nouveau mariage, à la date indiquée par
            rapport au mariage. Chaque tâche générée reste modifiable ou supprimable individuellement ensuite.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold text-foreground">Étapes</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4" aria-hidden="true" />
              Ajouter une étape
            </Button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune étape — aucune tâche ne sera générée automatiquement à la création d'un mariage.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {items.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Étape {index + 1}</p>
                    <button
                      type="button"
                      aria-label="Supprimer cette étape"
                      onClick={() => removeItem(item.id)}
                      className="relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-risk"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`tpl-${item.id}-title`}>Titre de la tâche</Label>
                    <Input
                      id={`tpl-${item.id}-title`}
                      value={item.title}
                      onChange={(e) => setItemField(item.id, { title: e.target.value })}
                      placeholder="Ex. Confirmer tous les prestataires"
                    />
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`tpl-${item.id}-days`}>Nombre de jours</Label>
                      <Input
                        id={`tpl-${item.id}-days`}
                        inputMode="numeric"
                        value={item.days}
                        onChange={(e) => setItemField(item.id, { days: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`tpl-${item.id}-direction`}>Par rapport au mariage</Label>
                      <Select
                        value={item.direction}
                        onValueChange={(v) => setItemField(item.id, { direction: v as Direction })}
                      >
                        <SelectTrigger id={`tpl-${item.id}-direction`} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="avant">Avant</SelectItem>
                          <SelectItem value="apres">Après</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error && <p className="text-sm text-risk">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer la checklist</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
