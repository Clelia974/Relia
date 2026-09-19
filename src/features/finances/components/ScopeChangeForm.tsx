import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyScopeChangeFormValues,
  ScopeChangeFormSchema,
  type ScopeChangeFormValues,
} from '@/features/finances/scopeChangeForm.schema'
import { SCOPE_CHANGE_STATUS_LABELS, SCOPE_CHANGE_STATUS_OPTIONS } from '@/lib/scopeChangeStatus'
import type { ScopeChange } from '@/types/entities'

interface ScopeChangeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scopeChange?: ScopeChange | null
  defaultDate?: string
  onSubmit: (values: ScopeChangeFormValues) => void
}

function toFormValues(scopeChange: ScopeChange): ScopeChangeFormValues {
  return {
    description: scopeChange.description,
    date: scopeChange.date.slice(0, 10),
    vendorCost: String(scopeChange.vendorCost),
    clientPrice: String(scopeChange.clientPrice),
    status: scopeChange.status,
    notes: scopeChange.notes ?? '',
  }
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — voir VendorForm pour la même convention. */
export function ScopeChangeForm({ open, onOpenChange, scopeChange, defaultDate, onSubmit }: ScopeChangeFormProps) {
  const isEdit = Boolean(scopeChange)
  const [values, setValues] = useState<ScopeChangeFormValues>(() =>
    scopeChange ? toFormValues(scopeChange) : emptyScopeChangeFormValues(defaultDate),
  )
  const [errors, setErrors] = useState<Partial<Record<keyof ScopeChangeFormValues, string>>>({})

  const setField = <K extends keyof ScopeChangeFormValues>(key: K, value: ScopeChangeFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = ScopeChangeFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ScopeChangeFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ScopeChangeFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit(result.data)
  }

  const vendorCostNum = Number(values.vendorCost) || 0
  const clientPriceNum = Number(values.clientPrice) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le changement' : 'Ajouter un changement'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour ce changement de périmètre.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Field label="Description du changement" htmlFor="sc-description" error={errors.description}>
            <Input
              id="sc-description"
              placeholder="Ex. Ajout d'une deuxième salle pour le vin d'honneur"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'sc-description-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Coût fournisseur" htmlFor="sc-vendor-cost" error={errors.vendorCost}>
              <Input
                id="sc-vendor-cost"
                inputMode="decimal"
                placeholder="Ex. 150"
                value={values.vendorCost}
                onChange={(e) => setField('vendorCost', e.target.value)}
                aria-invalid={Boolean(errors.vendorCost)}
                aria-describedby={errors.vendorCost ? 'sc-vendor-cost-error' : undefined}
              />
            </Field>
            <Field label="Prix facturé au client" htmlFor="sc-client-price" error={errors.clientPrice}>
              <Input
                id="sc-client-price"
                inputMode="decimal"
                placeholder="Ex. 450 — 0 si non facturé"
                value={values.clientPrice}
                onChange={(e) => setField('clientPrice', e.target.value)}
                aria-invalid={Boolean(errors.clientPrice)}
                aria-describedby={errors.clientPrice ? 'sc-client-price-error' : undefined}
              />
            </Field>
          </div>

          <p className="text-xs text-muted-foreground">
            Profit potentiel de ce changement : <span className="tabular-nums text-foreground">{(clientPriceNum - vendorCostNum).toLocaleString('fr-FR')} €</span>
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Date" htmlFor="sc-date" error={errors.date}>
              <Input
                id="sc-date"
                type="date"
                value={values.date}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'sc-date-error' : undefined}
              />
            </Field>
            <Field label="Statut" htmlFor="sc-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger
                  id="sc-status"
                  className="w-full"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? 'sc-status-error' : undefined}
                >
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_CHANGE_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {SCOPE_CHANGE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="sc-notes" optional>
            <Textarea id="sc-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Ajouter le changement'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
