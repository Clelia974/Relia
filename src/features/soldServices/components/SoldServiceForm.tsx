import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { emptySoldServiceFormValues, SoldServiceFormSchema, type SoldServiceFormValues } from '@/features/soldServices/soldServiceForm.schema'

interface SoldServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SoldServiceFormValues) => void
}

/** Formulaire d'ajout d'une prestation vendue "ajoutée ultérieurement" — le parent doit remonter ce composant (prop `key`) à chaque ouverture, cf. TaskForm/VendorForm pour la même convention. */
export function SoldServiceForm({ open, onOpenChange, onSubmit }: SoldServiceFormProps) {
  const [values, setValues] = useState<SoldServiceFormValues>(emptySoldServiceFormValues)
  const [errors, setErrors] = useState<Partial<Record<keyof SoldServiceFormValues, string>>>({})

  const setField = <K extends keyof SoldServiceFormValues>(key: K, value: SoldServiceFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = SoldServiceFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SoldServiceFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SoldServiceFormValues
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
          <DialogTitle>Ajouter une prestation vendue</DialogTitle>
          <DialogDescription>Pour un service vendu après la proposition initiale (ex. un ajout demandé par le couple).</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Field label="Titre" htmlFor="ss-title" error={errors.title}>
            <Input
              id="ss-title"
              placeholder="Ex. Guirlande lumineuse supplémentaire"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'ss-title-error' : undefined}
            />
          </Field>

          <Field label="Description" htmlFor="ss-description" optional>
            <Textarea id="ss-description" rows={2} value={values.description} onChange={(e) => setField('description', e.target.value)} />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Quantité" htmlFor="ss-quantity" optional error={errors.quantity}>
              <Input
                id="ss-quantity"
                inputMode="decimal"
                value={values.quantity}
                onChange={(e) => setField('quantity', e.target.value)}
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={errors.quantity ? 'ss-quantity-error' : undefined}
              />
            </Field>
            <Field label="Prix vendu" htmlFor="ss-price" error={errors.soldPrice}>
              <Input
                id="ss-price"
                inputMode="decimal"
                value={values.soldPrice}
                onChange={(e) => setField('soldPrice', e.target.value)}
                aria-invalid={Boolean(errors.soldPrice)}
                aria-describedby={errors.soldPrice ? 'ss-price-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="ss-notes" optional>
            <Textarea id="ss-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
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
