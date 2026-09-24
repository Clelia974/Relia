import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { emptyWeddingFormValues, WeddingFormSchema, type WeddingFormValues } from '@/features/weddings/weddingForm.schema'
import { useWeddingLimit } from '@/features/payment/useWeddingLimit'
import { WEDDING_STATUS_LABELS, WEDDING_STATUS_OPTIONS } from '@/lib/weddingStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function NewWeddingPage() {
  const navigate = useNavigate()
  const createWedding = useWorkspaceStore((s) => s.createWedding)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const { canCreate, weddingCount, limit } = useWeddingLimit()

  const [values, setValues] = useState<WeddingFormValues>(emptyWeddingFormValues())
  const [errors, setErrors] = useState<Partial<Record<keyof WeddingFormValues, string>>>({})
  const [generateDefaultTasks, setGenerateDefaultTasks] = useState(true)
  const templateCount = taskTemplate.length || createDefaultTaskTemplate().length

  const setField = <K extends keyof WeddingFormValues>(key: K, value: WeddingFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const result = WeddingFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof WeddingFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof WeddingFormValues
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    const weddingDate = new Date(result.data.date).toISOString()
    const id = createWedding({
      coupleName: result.data.coupleName,
      date: weddingDate,
      venue: result.data.venue,
      soldAmount: result.data.soldAmount === '' ? 0 : Number(result.data.soldAmount),
      clientBudget: result.data.clientBudget === '' ? 0 : Number(result.data.clientBudget),
      status: result.data.status,
      notes: result.data.notes.trim() || undefined,
    })

    if (generateDefaultTasks) {
      const template = taskTemplate.length > 0 ? taskTemplate : createDefaultTaskTemplate()
      const defaultTasks = buildDefaultTasksForWedding(id, weddingDate, template)
      for (const task of defaultTasks) addTask(task)
      toast.success(`Votre mariage a été créé avec ${defaultTasks.length} tâches de démarrage.`)
    } else {
      toast.success('Votre mariage a été créé.')
    }
    navigate(`/mariages/${id}`, { state: { justCreated: true } })
  }

  // Filet de sécurité pour un accès direct par URL — le point d'entrée normal (bouton "Créer un mariage" sur MariagesListPage) intercepte déjà le clic avant d'arriver ici.
  if (!canCreate) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-lg border border-dashed border-border px-6 py-16 text-center">
        <h1 className="font-heading text-xl font-semibold text-foreground">Limite de la version Gratuite atteinte</h1>
        <p className="text-sm text-muted-foreground">
          La version Gratuite est limitée à {limit} mariages (vous en avez {weddingCount}). Passez au Pro pour créer
          des mariages en illimité.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/mariages">Retour aux mariages</Link>
          </Button>
          <Button asChild>
            <Link to="/paiement">Passer au Pro</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Créer un mariage</h1>
        <p className="mt-1 text-sm text-muted-foreground">Les informations essentielles suffisent pour démarrer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du mariage</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <Field label="Nom du couple" htmlFor="coupleName" error={errors.coupleName}>
              <Input
                id="coupleName"
                placeholder="Ex. Camille & Thomas"
                value={values.coupleName}
                onChange={(e) => setField('coupleName', e.target.value)}
                aria-invalid={Boolean(errors.coupleName)}
                aria-describedby={errors.coupleName ? 'coupleName-error' : undefined}
              />
            </Field>

            <Field label="Date du mariage" htmlFor="date" error={errors.date}>
              <Input
                id="date"
                type="date"
                value={values.date}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'date-error' : undefined}
              />
            </Field>

            <Field label="Lieu du mariage" htmlFor="venue" error={errors.venue} optional>
              <Input
                id="venue"
                placeholder="Ex. Domaine des Fleurs"
                value={values.venue}
                onChange={(e) => setField('venue', e.target.value)}
              />
            </Field>

            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
              <Field label="Montant du contrat" htmlFor="soldAmount" error={errors.soldAmount} optional>
                <Input
                  id="soldAmount"
                  inputMode="decimal"
                  placeholder="Ex. 8 500 €"
                  value={values.soldAmount}
                  onChange={(e) => setField('soldAmount', e.target.value)}
                  aria-invalid={Boolean(errors.soldAmount)}
                  aria-describedby={errors.soldAmount ? 'soldAmount-error' : undefined}
                />
              </Field>

              <Field label="Budget client" htmlFor="clientBudget" error={errors.clientBudget} optional>
                <Input
                  id="clientBudget"
                  inputMode="decimal"
                  placeholder="Ex. 9 000 €"
                  value={values.clientBudget}
                  onChange={(e) => setField('clientBudget', e.target.value)}
                  aria-invalid={Boolean(errors.clientBudget)}
                  aria-describedby={errors.clientBudget ? 'clientBudget-error' : undefined}
                />
              </Field>
            </div>

            <Field label="Statut du mariage" htmlFor="status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v as WeddingFormValues['status'])}>
                <SelectTrigger id="status" className="w-full">
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

            <Field label="Notes" htmlFor="notes" optional>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Ex. préférences du couple, contraintes particulières…"
                value={values.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </Field>

            <label htmlFor="generateDefaultTasks" className="flex items-start gap-2.5 text-sm">
              <Checkbox
                id="generateDefaultTasks"
                checked={generateDefaultTasks}
                onCheckedChange={(checked) => setGenerateDefaultTasks(checked === true)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">Générer une checklist de démarrage</span>
                <span className="block text-muted-foreground">
                  {templateCount} tâche{templateCount > 1 ? 's' : ''} ajoutée{templateCount > 1 ? 's' : ''}{' '}
                  automatiquement, à modifier ou supprimer ensuite librement. Le modèle se personnalise depuis
                  Paramètres.
                </span>
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Annuler
              </Button>
              <Button type="submit">Créer le mariage</Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
