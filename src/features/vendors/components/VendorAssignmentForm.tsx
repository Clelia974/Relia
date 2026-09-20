import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CostReviewBadge } from '@/components/CostReviewBadge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/features/vendors/components/VendorForm'
import type { VendorAssignment } from '@/features/vendors/assignments'
import { VendorAssignmentFormSchema, type VendorAssignmentFormValues } from '@/features/vendors/vendorForm.schema'
import { useReturnFocus } from '@/lib/useReturnFocus'
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_OPTIONS } from '@/lib/vendorStatus'

interface VendorAssignmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: VendorAssignment
  weddingName?: string
  onSubmit: (values: VendorAssignmentFormValues) => void
}

function toFormValues({ link }: VendorAssignment): VendorAssignmentFormValues {
  return {
    status: link.status,
    arrivalTime: link.arrivalTime ?? '',
    estimatedCost: link.estimatedCost !== undefined ? String(link.estimatedCost) : '',
    actualCost: link.actualCost !== undefined ? String(link.actualCost) : '',
    assignmentNotes: link.notes ?? '',
  }
}

/** Modifie UNIQUEMENT l'affectation à un mariage (statut, horaire, coûts, notes) — jamais la fiche catalogue. Le parent doit remonter ce composant (prop `key`) à chaque ouverture. */
export function VendorAssignmentForm({ open, onOpenChange, assignment, weddingName, onSubmit }: VendorAssignmentFormProps) {
  const returnFocus = useReturnFocus()
  const [values, setValues] = useState<VendorAssignmentFormValues>(() => toFormValues(assignment))
  const [errors, setErrors] = useState<Partial<Record<keyof VendorAssignmentFormValues, string>>>({})

  const setField = <K extends keyof VendorAssignmentFormValues>(key: K, value: VendorAssignmentFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = VendorAssignmentFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof VendorAssignmentFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof VendorAssignmentFormValues
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
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto" {...returnFocus}>
        <DialogHeader>
          <DialogTitle>Modifier l'affectation</DialogTitle>
          <DialogDescription>
            {assignment.vendor.name}
            {weddingName ? ` · ${weddingName}` : ''} — ces informations ne concernent que ce mariage.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Statut pour ce mariage" htmlFor="va-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger id="va-status" className="w-full" aria-invalid={Boolean(errors.status)}>
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
            <Field label="Heure d'arrivée" htmlFor="va-arrival" error={errors.arrivalTime} optional>
              <Input
                id="va-arrival"
                type="time"
                value={values.arrivalTime}
                onChange={(e) => setField('arrivalTime', e.target.value)}
                aria-invalid={Boolean(errors.arrivalTime)}
                aria-describedby={errors.arrivalTime ? 'va-arrival-error' : undefined}
              />
            </Field>
          </div>

          {assignment.link.needsCostReview && <CostReviewBadge />}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Coût estimé" htmlFor="va-estimated" error={errors.estimatedCost} optional>
              <Input
                id="va-estimated"
                inputMode="decimal"
                placeholder="Ex. 850 €"
                value={values.estimatedCost}
                onChange={(e) => setField('estimatedCost', e.target.value)}
                aria-invalid={Boolean(errors.estimatedCost)}
                aria-describedby={errors.estimatedCost ? 'va-estimated-error' : undefined}
              />
            </Field>
            <Field label="Coût réel" htmlFor="va-actual" error={errors.actualCost} optional>
              <Input
                id="va-actual"
                inputMode="decimal"
                placeholder="Ex. 900 €"
                value={values.actualCost}
                onChange={(e) => setField('actualCost', e.target.value)}
                aria-invalid={Boolean(errors.actualCost)}
                aria-describedby={errors.actualCost ? 'va-actual-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Notes pour ce mariage" htmlFor="va-notes" optional>
            <Textarea id="va-notes" rows={3} value={values.assignmentNotes} onChange={(e) => setField('assignmentNotes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
