import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyEquipmentItemFormValues,
  EquipmentItemFormSchema,
  type EquipmentItemFormValues,
} from '@/features/equipment/equipmentForm.schema'
import { EQUIPMENT_ACQUISITION_MODE_LABELS, EQUIPMENT_ACQUISITION_MODE_OPTIONS } from '@/lib/equipmentAcquisitionMode'
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '@/lib/equipmentStatus'
import type { EquipmentItem } from '@/types/entities'

interface EquipmentItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: EquipmentItem | null
  onSubmit: (values: EquipmentItemFormValues) => void
}

function toFormValues(item: EquipmentItem): EquipmentItemFormValues {
  return {
    name: item.name,
    quantity: String(item.quantity),
    category: item.category ?? '',
    acquisitionMode: item.acquisitionMode,
    status: item.status,
    notes: item.notes ?? '',
  }
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — voir TaskForm/VendorForm pour la même convention. */
export function EquipmentItemForm({ open, onOpenChange, item, onSubmit }: EquipmentItemFormProps) {
  const isEdit = Boolean(item)
  const [values, setValues] = useState<EquipmentItemFormValues>(() => (item ? toFormValues(item) : emptyEquipmentItemFormValues()))
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentItemFormValues, string>>>({})

  const setField = <K extends keyof EquipmentItemFormValues>(key: K, value: EquipmentItemFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = EquipmentItemFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EquipmentItemFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof EquipmentItemFormValues
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'élément" : 'Ajouter un élément'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations de cet élément.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
          <Field label="Nom" htmlFor="eq-name" error={errors.name}>
            <Input
              id="eq-name"
              placeholder="Ex. Chaises pliantes"
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'eq-name-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Quantité nécessaire" htmlFor="eq-quantity" error={errors.quantity}>
              <Input
                id="eq-quantity"
                inputMode="decimal"
                value={values.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={errors.quantity ? 'eq-quantity-error' : undefined}
              />
            </Field>
            <Field label="Catégorie / zone" htmlFor="eq-category" optional>
              <Input
                id="eq-category"
                placeholder="Ex. Réception"
                value={values.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Mode d'obtention" htmlFor="eq-acquisition" error={errors.acquisitionMode}>
              <Select value={values.acquisitionMode} onValueChange={(v) => setField('acquisitionMode', v)}>
                <SelectTrigger
                  id="eq-acquisition"
                  className="w-full"
                  aria-invalid={Boolean(errors.acquisitionMode)}
                  aria-describedby={errors.acquisitionMode ? 'eq-acquisition-error' : undefined}
                >
                  <SelectValue placeholder="Sélectionnez un mode" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_ACQUISITION_MODE_OPTIONS.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {EQUIPMENT_ACQUISITION_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Statut" htmlFor="eq-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger id="eq-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {EQUIPMENT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="eq-notes" optional>
            <Textarea id="eq-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
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
