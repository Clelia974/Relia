import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateLineItemTotal } from '@/features/proposals/calculations'
import { PROPOSAL_CATEGORY_SUGGESTIONS } from '@/features/proposals/templates'
import type { ProposalLineItemFormValues } from '@/features/proposals/proposalForm.schema'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

interface LineItemsEditorProps {
  lines: ProposalLineItemFormValues[]
  errors: Record<string, Partial<Record<keyof ProposalLineItemFormValues, string>>>
  onChange: (id: string, patch: Partial<ProposalLineItemFormValues>) => void
  onRemove: (id: string) => void
}

export function LineItemsEditor({ lines, errors, onChange, onRemove }: LineItemsEditorProps) {
  if (lines.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Aucune ligne pour l'instant — ajoutez une ligne ou une option.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, index) => {
        const rowErrors = errors[line.id] ?? {}
        const quantityNum = Number(line.quantity) || 0
        const unitPriceNum = Number(line.unitPrice) || 0
        const total = calculateLineItemTotal({ quantity: quantityNum, unitPrice: unitPriceNum })

        return (
          <Card key={line.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Ligne {index + 1}</p>
                <button
                  type="button"
                  aria-label="Supprimer cette ligne"
                  onClick={() => onRemove(line.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-risk"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <Field label="Description du service" htmlFor={`li-${line.id}-description`} error={rowErrors.description}>
                <Input
                  id={`li-${line.id}-description`}
                  value={line.description}
                  onChange={(e) => onChange(line.id, { description: e.target.value })}
                  placeholder="Ex. Centres de table"
                  aria-invalid={Boolean(rowErrors.description)}
                  aria-describedby={rowErrors.description ? `li-${line.id}-description-error` : undefined}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Catégorie" htmlFor={`li-${line.id}-category`} error={rowErrors.category}>
                  <Input
                    id={`li-${line.id}-category`}
                    list={`categories-${line.id}`}
                    value={line.category}
                    onChange={(e) => onChange(line.id, { category: e.target.value })}
                    placeholder="Ex. Décoration"
                    aria-invalid={Boolean(rowErrors.category)}
                    aria-describedby={rowErrors.category ? `li-${line.id}-category-error` : undefined}
                  />
                  <datalist id={`categories-${line.id}`}>
                    {PROPOSAL_CATEGORY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Quantité" htmlFor={`li-${line.id}-quantity`} error={rowErrors.quantity}>
                  <Input
                    id={`li-${line.id}-quantity`}
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(e) => onChange(line.id, { quantity: e.target.value })}
                    aria-invalid={Boolean(rowErrors.quantity)}
                    aria-describedby={rowErrors.quantity ? `li-${line.id}-quantity-error` : undefined}
                  />
                </Field>
                <Field label="Prix unitaire" htmlFor={`li-${line.id}-unitPrice`} error={rowErrors.unitPrice}>
                  <Input
                    id={`li-${line.id}-unitPrice`}
                    inputMode="decimal"
                    value={line.unitPrice}
                    onChange={(e) => onChange(line.id, { unitPrice: e.target.value })}
                    aria-invalid={Boolean(rowErrors.unitPrice)}
                    aria-describedby={rowErrors.unitPrice ? `li-${line.id}-unitPrice-error` : undefined}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={line.included}
                      onCheckedChange={(checked) => onChange(line.id, { included: checked === true })}
                    />
                    Service inclus
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={line.optional}
                      onCheckedChange={(checked) => onChange(line.id, { optional: checked === true })}
                    />
                    Option facultative
                  </label>
                </div>
                <p className="text-sm font-medium tabular-nums text-foreground">{currency.format(total)}</p>
              </div>

              <Field label="Notes" htmlFor={`li-${line.id}-notes`} optional>
                <Input id={`li-${line.id}-notes`} value={line.notes} onChange={(e) => onChange(line.id, { notes: e.target.value })} />
              </Field>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-risk">
          {error}
        </p>
      )}
    </div>
  )
}
