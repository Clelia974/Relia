import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CostReviewBadge } from '@/components/CostReviewBadge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { emptyVendorFormValues, VendorFormSchema, type VendorFormValues } from '@/features/vendors/vendorForm.schema'
import { VENDOR_CATEGORIES } from '@/lib/vendorCategory'
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_OPTIONS } from '@/lib/vendorStatus'
import type { Vendor, VendorWeddingLink } from '@/types/entities'

interface VendorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor | null
  /** Coût de ce prestataire pour LE mariage courant — absent si jamais renseigné pour ce mariage. */
  costForThisWedding?: Pick<VendorWeddingLink, 'estimatedCost' | 'actualCost' | 'needsCostReview'>
  onSubmit: (values: VendorFormValues) => void
}

function toFormValues(vendor: Vendor, costForThisWedding?: Pick<VendorWeddingLink, 'estimatedCost' | 'actualCost'>): VendorFormValues {
  return {
    name: vendor.name,
    company: vendor.company ?? '',
    category: vendor.category,
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    estimatedCost: costForThisWedding?.estimatedCost !== undefined ? String(costForThisWedding.estimatedCost) : '',
    actualCost: costForThisWedding?.actualCost !== undefined ? String(costForThisWedding.actualCost) : '',
    arrivalTime: vendor.arrivalTime ?? '',
    status: vendor.status,
    notes: vendor.notes ?? '',
  }
}

/**
 * Le parent doit remonter ce composant (prop `key`) à chaque ouverture —
 * l'état initial dérive directement des props plutôt que d'être resynchronisé
 * par un effect, pour éviter un rendu en cascade.
 */
export function VendorForm({ open, onOpenChange, vendor, costForThisWedding, onSubmit }: VendorFormProps) {
  const isEdit = Boolean(vendor)
  const [values, setValues] = useState<VendorFormValues>(() =>
    vendor ? toFormValues(vendor, costForThisWedding) : { ...emptyVendorFormValues(), status: 'a_contacter' },
  )
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormValues, string>>>({})

  const setField = <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = VendorFormSchema.safeParse(values)
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
    onSubmit(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le prestataire' : 'Ajouter un prestataire'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations de ce prestataire.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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

          {costForThisWedding?.needsCostReview && <CostReviewBadge />}

          <div className="grid gap-4 sm:grid-cols-3">
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

          <Field label="Notes" htmlFor="v-notes" optional>
            <Textarea
              id="v-notes"
              rows={3}
              value={values.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </Field>

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
