import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { emptyExpenseFormValues, ExpenseFormSchema, type ExpenseFormValues } from '@/features/finances/expenseForm.schema'
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_OPTIONS } from '@/lib/expenseCategory'
import { EXPENSE_STATUS_LABELS, EXPENSE_STATUS_OPTIONS } from '@/lib/expenseStatus'
import type { Expense } from '@/types/entities'

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  defaultDate?: string
  onSubmit: (values: ExpenseFormValues) => void
}

function toFormValues(expense: Expense): ExpenseFormValues {
  return {
    description: expense.description,
    category: expense.category,
    amount: String(expense.amount),
    date: expense.date.slice(0, 10),
    status: expense.status,
    notes: expense.notes ?? '',
  }
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — voir VendorForm pour la même convention. */
export function ExpenseForm({ open, onOpenChange, expense, defaultDate, onSubmit }: ExpenseFormProps) {
  const isEdit = Boolean(expense)
  const [values, setValues] = useState<ExpenseFormValues>(() =>
    expense ? toFormValues(expense) : emptyExpenseFormValues(defaultDate),
  )
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormValues, string>>>({})

  const setField = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = ExpenseFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ExpenseFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ExpenseFormValues
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
          <DialogTitle>{isEdit ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour cette dépense.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Field label="Description de la dépense" htmlFor="ex-description" error={errors.description}>
            <Input
              id="ex-description"
              placeholder="Ex. Location de mobilier"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'ex-description-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catégorie" htmlFor="ex-category" error={errors.category}>
              <Select value={values.category} onValueChange={(v) => setField('category', v)}>
                <SelectTrigger
                  id="ex-category"
                  className="w-full"
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? 'ex-category-error' : undefined}
                >
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {EXPENSE_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Montant" htmlFor="ex-amount" error={errors.amount}>
              <Input
                id="ex-amount"
                inputMode="decimal"
                placeholder="Ex. 450"
                value={values.amount}
                onChange={(e) => setField('amount', e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'ex-amount-error' : undefined}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="ex-date" error={errors.date}>
              <Input
                id="ex-date"
                type="date"
                value={values.date}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'ex-date-error' : undefined}
              />
            </Field>
            <Field label="Statut" htmlFor="ex-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger
                  id="ex-status"
                  className="w-full"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? 'ex-status-error' : undefined}
                >
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {EXPENSE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="ex-notes" optional>
            <Textarea id="ex-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Ajouter la dépense'}</Button>
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
