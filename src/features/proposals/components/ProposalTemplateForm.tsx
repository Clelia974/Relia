import { type FormEvent, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PROPOSAL_CATEGORY_SUGGESTIONS } from '@/features/proposals/templates'
import { generateId } from '@/lib/id'
import type { ProposalTemplate, ProposalTemplateLine } from '@/types/entities'

interface DraftLine {
  id: string
  description: string
  category: string
  quantity: string
  unitPrice: string
  included: boolean
  optional: boolean
}

function toDraftLine(line: ProposalTemplateLine): DraftLine {
  return {
    id: line.id,
    description: line.description,
    category: line.category,
    quantity: String(line.quantity),
    unitPrice: String(line.unitPrice),
    included: line.included,
    optional: line.optional,
  }
}

function emptyDraftLine(): DraftLine {
  return { id: generateId(), description: '', category: '', quantity: '1', unitPrice: '', included: true, optional: false }
}

interface ProposalTemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ProposalTemplate
  onSubmit: (values: { label: string; tagline: string; showOnDocuments: boolean; lines: ProposalTemplateLine[] }) => void
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — voir ExpenseForm pour la même convention. */
export function ProposalTemplateForm({ open, onOpenChange, template, onSubmit }: ProposalTemplateFormProps) {
  const [label, setLabel] = useState(template.label)
  const [tagline, setTagline] = useState(template.tagline ?? '')
  const [showOnDocuments, setShowOnDocuments] = useState(template.showOnDocuments !== false)
  const [lines, setLines] = useState<DraftLine[]>(() => template.lines.map(toDraftLine))
  const [error, setError] = useState<string | null>(null)

  const setLineField = (id: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const addLine = () => setLines((prev) => [...prev, emptyDraftLine()])
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!label.trim()) {
      setError('Veuillez renseigner le nom de la formule.')
      return
    }
    if (lines.length === 0) {
      setError('Ajoutez au moins une ligne.')
      return
    }
    for (const line of lines) {
      if (!line.description.trim() || !line.category.trim()) {
        setError('Chaque ligne doit avoir une description et une catégorie.')
        return
      }
      const quantity = Number(line.quantity)
      const unitPrice = Number(line.unitPrice)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError('Veuillez saisir une quantité valide sur chaque ligne.')
        return
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        setError('Veuillez saisir un prix valide sur chaque ligne.')
        return
      }
    }

    setError(null)
    onSubmit({
      label: label.trim(),
      tagline: tagline.trim(),
      showOnDocuments,
      lines: lines.map((l) => ({
        id: l.id,
        description: l.description.trim(),
        category: l.category.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        included: l.included,
        optional: l.optional,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la formule</DialogTitle>
          <DialogDescription>
            Ces lignes préconfigurées initialisent une nouvelle proposition — elles restent modifiables ligne par ligne une fois la proposition créée.
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-label">Nom de la formule</Label>
              <Input id="tpl-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Silver" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-tagline">
                Accroche <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="tpl-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex. Une formule essentielle…" />
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox id="tpl-show" checked={showOnDocuments} onCheckedChange={(checked) => setShowOnDocuments(checked === true)} className="mt-0.5" />
            <Label htmlFor="tpl-show" className="flex flex-col items-start gap-0.5 font-normal">
              <span className="text-foreground">Afficher le nom de la formule sur les devis</span>
              <span className="text-xs text-muted-foreground">
                Décoché : le nom reste visible pour vous, mais n'apparaît ni dans le titre proposé ni sur le devis remis au client.
              </span>
            </Label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-semibold text-foreground">Lignes préconfigurées</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="size-4" aria-hidden="true" />
              Ajouter une ligne
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {lines.map((line, index) => (
              <Card key={line.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Ligne {index + 1}</p>
                    <button
                      type="button"
                      aria-label="Supprimer cette ligne"
                      onClick={() => removeLine(line.id)}
                      className="relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-risk"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`tpl-${line.id}-description`}>Description</Label>
                    <Input
                      id={`tpl-${line.id}-description`}
                      value={line.description}
                      onChange={(e) => setLineField(line.id, { description: e.target.value })}
                      placeholder="Ex. Centres de table"
                    />
                  </div>

                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`tpl-${line.id}-category`}>Catégorie</Label>
                      <Input
                        id={`tpl-${line.id}-category`}
                        list={`tpl-categories-${line.id}`}
                        value={line.category}
                        onChange={(e) => setLineField(line.id, { category: e.target.value })}
                        placeholder="Ex. Décoration"
                      />
                      <datalist id={`tpl-categories-${line.id}`}>
                        {PROPOSAL_CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`tpl-${line.id}-quantity`}>Quantité</Label>
                      <Input
                        id={`tpl-${line.id}-quantity`}
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) => setLineField(line.id, { quantity: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`tpl-${line.id}-unitPrice`}>Prix unitaire</Label>
                      <Input
                        id={`tpl-${line.id}-unitPrice`}
                        inputMode="decimal"
                        value={line.unitPrice}
                        onChange={(e) => setLineField(line.id, { unitPrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={line.included}
                        onCheckedChange={(checked) => setLineField(line.id, { included: checked === true })}
                      />
                      Service inclus
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={line.optional}
                        onCheckedChange={(checked) => setLineField(line.id, { optional: checked === true })}
                      />
                      Option facultative
                    </label>
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
            <Button type="submit">Enregistrer la formule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
