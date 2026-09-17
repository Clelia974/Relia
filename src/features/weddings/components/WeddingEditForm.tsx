import { type FormEvent, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  weddingToEditFormValues,
  WeddingEditFormSchema,
  type WeddingEditFormValues,
} from '@/features/weddings/weddingEditForm.schema'
import { WEDDING_STATUS_LABELS, WEDDING_STATUS_OPTIONS } from '@/lib/weddingStatus'
import type { Wedding } from '@/types/entities'

interface WeddingEditFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wedding: Wedding
  /** Au moins un événement de planning existe déjà pour ce mariage — sert à l'avertissement date. */
  hasTimelineEvents: boolean
  onSubmit: (values: WeddingEditFormValues) => void
}

/**
 * Le parent doit remonter ce composant (prop `key`) à chaque ouverture —
 * mêmes conventions que VendorForm : état initial dérivé des props plutôt
 * que resynchronisé par un effect.
 */
export function WeddingEditForm({ open, onOpenChange, wedding, hasTimelineEvents, onSubmit }: WeddingEditFormProps) {
  const [initialValues] = useState<WeddingEditFormValues>(() => weddingToEditFormValues(wedding))
  const [values, setValues] = useState<WeddingEditFormValues>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof WeddingEditFormValues, string>>>({})
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)
  const showPlanningWarning = hasTimelineEvents && values.date !== initialValues.date

  const setField = <K extends keyof WeddingEditFormValues>(key: K, value: WeddingEditFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  /** Fonction unique interceptant toute tentative de fermeture — bouton Annuler, croix, Échap, clic extérieur (tout passe par onOpenChange du Dialog Radix). */
  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = WeddingEditFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof WeddingEditFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof WeddingEditFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onSubmit(result.data)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : requestClose())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le mariage</DialogTitle>
            <DialogDescription>Mettez à jour les informations de ce mariage.</DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <Field label="Nom du couple" htmlFor="w-coupleName" error={errors.coupleName}>
              <Input
                id="w-coupleName"
                value={values.coupleName}
                onChange={(e) => setField('coupleName', e.target.value)}
                aria-invalid={Boolean(errors.coupleName)}
                aria-describedby={errors.coupleName ? 'w-coupleName-error' : undefined}
              />
            </Field>

            <Field label="Date du mariage" htmlFor="w-date" error={errors.date}>
              <Input
                id="w-date"
                type="date"
                value={values.date}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'w-date-error' : undefined}
              />
            </Field>

            {showPlanningWarning && (
              <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg px-4 py-2.5 text-sm text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Le planning existant ne sera pas automatiquement décalé. Vérifiez les dates des événements après
                  avoir enregistré.
                </span>
              </p>
            )}

            <Field label="Lieu du mariage" htmlFor="w-venue" error={errors.venue} optional>
              <Input id="w-venue" value={values.venue} onChange={(e) => setField('venue', e.target.value)} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Montant vendu" htmlFor="w-soldAmount" error={errors.soldAmount} optional>
                <Input
                  id="w-soldAmount"
                  inputMode="decimal"
                  value={values.soldAmount}
                  onChange={(e) => setField('soldAmount', e.target.value)}
                  aria-invalid={Boolean(errors.soldAmount)}
                  aria-describedby={errors.soldAmount ? 'w-soldAmount-error' : undefined}
                />
              </Field>

              <Field label="Budget client" htmlFor="w-clientBudget" error={errors.clientBudget} optional>
                <Input
                  id="w-clientBudget"
                  inputMode="decimal"
                  value={values.clientBudget}
                  onChange={(e) => setField('clientBudget', e.target.value)}
                  aria-invalid={Boolean(errors.clientBudget)}
                  aria-describedby={errors.clientBudget ? 'w-clientBudget-error' : undefined}
                />
              </Field>
            </div>

            <Field label="Statut du mariage" htmlFor="w-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v as WeddingEditFormValues['status'])}>
                <SelectTrigger id="w-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEDDING_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {WEDDING_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="w-archived"
                  checked={values.archived}
                  onCheckedChange={(checked) => setField('archived', checked === true)}
                />
                <Label htmlFor="w-archived" className="font-normal">
                  Archiver ce mariage
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                L'archivage masque ce mariage des vues actives (finances, tableau de bord) sans changer son statut.
                Vous pourrez le désarchiver à tout moment.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestClose}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonner les modifications ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les modifications apportées à ce mariage n'ont pas été enregistrées. Si vous continuez, elles seront
              perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l'édition</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscardOpen(false)
                onOpenChange(false)
              }}
            >
              Abandonner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
