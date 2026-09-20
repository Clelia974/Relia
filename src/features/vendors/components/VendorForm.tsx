import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyVendorFormValues,
  VendorFormSchema,
  VendorGlobalFormSchema,
  type VendorFormValues,
} from '@/features/vendors/vendorForm.schema'
import { useReturnFocus } from '@/lib/useReturnFocus'
import { VENDOR_CATEGORIES } from '@/lib/vendorCategory'
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_OPTIONS } from '@/lib/vendorStatus'
import type { Vendor } from '@/types/entities'

interface VendorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prestataire dont on modifie la fiche catalogue (champs globaux uniquement) ; absent = création. */
  vendor?: Vendor | null
  /** Création depuis un mariage : ajoute les champs propres à ce mariage (statut, horaire, coûts, notes). Ignoré en modification. */
  withAssignment?: boolean
  onSubmit: (values: VendorFormValues) => void
}

function toFormValues(vendor: Vendor): VendorFormValues {
  return {
    ...emptyVendorFormValues(),
    name: vendor.name,
    company: vendor.company ?? '',
    category: vendor.category,
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    notes: vendor.notes ?? '',
  }
}

/**
 * Le parent doit remonter ce composant (prop `key`) à chaque ouverture —
 * l'état initial dérive directement des props plutôt que d'être resynchronisé
 * par un effect, pour éviter un rendu en cascade.
 */
export function VendorForm({ open, onOpenChange, vendor, withAssignment = false, onSubmit }: VendorFormProps) {
  const returnFocus = useReturnFocus()
  const isEdit = Boolean(vendor)
  const showAssignment = withAssignment && !isEdit
  const [values, setValues] = useState<VendorFormValues>(() =>
    vendor ? toFormValues(vendor) : { ...emptyVendorFormValues(), status: 'a_contacter' },
  )
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormValues, string>>>({})

  const setField = <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = showAssignment ? VendorFormSchema.safeParse(values) : VendorGlobalFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof VendorFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof VendorFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit({ ...values, ...result.data })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" {...returnFocus}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la fiche prestataire' : 'Ajouter un prestataire'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Ces informations sont communes à tous les mariages de ce prestataire.'
              : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Nom du prestataire" htmlFor="v-name" error={errors.name}>
              <Input
                id="v-name"
                placeholder="Ex. Sophie Martin"
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'v-name-error' : undefined}
              />
            </Field>
            <Field label="Nom de l'entreprise" htmlFor="v-company" optional>
              <Input
                id="v-company"
                placeholder="Ex. Fleurs & Lumière"
                value={values.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Catégorie" htmlFor="v-category" error={errors.category}>
              <Select value={values.category} onValueChange={(v) => setField('category', v)}>
                <SelectTrigger
                  id="v-category"
                  className="w-full"
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? 'v-category-error' : undefined}
                >
                  <SelectValue placeholder="Ex. Fleuriste" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="v-phone" optional>
              <Input
                id="v-phone"
                type="tel"
                placeholder="Ex. 06 12 34 56 78"
                value={values.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </Field>
            <Field label="Adresse email" htmlFor="v-email" error={errors.email} optional>
              <Input
                id="v-email"
                type="email"
                placeholder="Ex. contact@exemple.fr"
                value={values.email}
                onChange={(e) => setField('email', e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'v-email-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Notes générales" htmlFor="v-notes" optional>
            <Textarea
              id="v-notes"
              rows={3}
              value={values.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </Field>

          {showAssignment && (
            <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Pour ce mariage</legend>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Field label="Statut du prestataire" htmlFor="v-status" error={errors.status}>
                  <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                    <SelectTrigger
                      id="v-status"
                      className="w-full"
                      aria-invalid={Boolean(errors.status)}
                      aria-describedby={errors.status ? 'v-status-error' : undefined}
                    >
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {VENDOR_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Field label="Coût estimé" htmlFor="v-estimated" error={errors.estimatedCost} optional>
              <Input
                id="v-estimated"
                inputMode="decimal"
                placeholder="Ex. 850 €"
                value={values.estimatedCost}
                onChange={(e) => setField('estimatedCost', e.target.value)}
                aria-invalid={Boolean(errors.estimatedCost)}
                aria-describedby={errors.estimatedCost ? 'v-estimated-error' : undefined}
              />
            </Field>
            <Field label="Coût réel" htmlFor="v-actual" error={errors.actualCost} optional>
              <Input
                id="v-actual"
                inputMode="decimal"
                placeholder="Ex. 900 €"
                value={values.actualCost}
                onChange={(e) => setField('actualCost', e.target.value)}
                aria-invalid={Boolean(errors.actualCost)}
                aria-describedby={errors.actualCost ? 'v-actual-error' : undefined}
              />
            </Field>
            <Field label="Heure d'arrivée" htmlFor="v-arrival" error={errors.arrivalTime} optional>
              <Input
                id="v-arrival"
                type="time"
                value={values.arrivalTime}
                onChange={(e) => setField('arrivalTime', e.target.value)}
                aria-invalid={Boolean(errors.arrivalTime)}
                aria-describedby={errors.arrivalTime ? 'v-arrival-error' : undefined}
              />
            </Field>
          </div>

              <Field label="Notes pour ce mariage" htmlFor="v-assignment-notes" optional>
                <Textarea
                  id="v-assignment-notes"
                  rows={2}
                  value={values.assignmentNotes}
                  onChange={(e) => setField('assignmentNotes', e.target.value)}
                />
              </Field>
            </fieldset>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Ajouter le prestataire'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Field({
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
