import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { emptyTaskFormValues, TaskFormSchema, type TaskFormValues } from '@/features/tasks/taskForm.schema'
import { DAY_PHASE_LABELS, DAY_PHASE_OPTIONS } from '@/lib/dayPhase'
import { formatShortDate } from '@/lib/dateFormat'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_OPTIONS } from '@/lib/taskPriority'
import { TASK_STATUS_LABELS, TASK_STATUS_OPTIONS } from '@/lib/taskStatus'
import { TASK_WAITING_ON_LABELS, TASK_WAITING_ON_OPTIONS } from '@/lib/taskWaitingOn'
import type { Task, Vendor, Wedding } from '@/types/entities'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultWeddingId?: string
  weddings: Wedding[]
  vendors: Vendor[]
  onSubmit: (values: TaskFormValues) => void
}

function toFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    weddingId: task.weddingId ?? '',
    vendorId: task.vendorId ?? '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    startDate: task.startDate ? task.startDate.slice(0, 10) : '',
    endDate: task.endDate ? task.endDate.slice(0, 10) : '',
    priority: task.priority,
    status: task.status,
    waitingOn: task.waitingOn ?? '',
    waitingReason: task.waitingReason ?? '',
    notes: task.notes ?? '',
    phase: task.phase ?? '',
  }
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — voir VendorForm pour la même convention. */
export function TaskForm({ open, onOpenChange, task, defaultWeddingId, weddings, vendors, onSubmit }: TaskFormProps) {
  const isEdit = Boolean(task)
  const [values, setValues] = useState<TaskFormValues>(() =>
    task ? toFormValues(task) : emptyTaskFormValues(defaultWeddingId),
  )
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({})

  const setField = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const vendorsForWedding = vendors.filter((v) => values.weddingId && v.weddingIds.includes(values.weddingId))

  const handleWeddingChange = (weddingId: string) => {
    setValues((v) => (v.vendorId && !vendors.find((vendor) => vendor.id === v.vendorId)?.weddingIds.includes(weddingId)
      ? { ...v, weddingId, vendorId: '' }
      : { ...v, weddingId }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = TaskFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TaskFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TaskFormValues
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
          <DialogTitle>{isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations de cette tâche.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
          <Field label="Titre de la tâche" htmlFor="t-title" error={errors.title}>
            <Input
              id="t-title"
              placeholder="Ex. Confirmer l'arrivée du DJ"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 't-title-error' : undefined}
            />
          </Field>

          <Field label="Description" htmlFor="t-description" optional>
            <Textarea
              id="t-description"
              rows={2}
              placeholder="Ex. Demander l'heure d'installation et le contact sur place"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Mariage associé" htmlFor="t-wedding" error={errors.weddingId}>
              <Select value={values.weddingId} onValueChange={handleWeddingChange}>
                <SelectTrigger
                  id="t-wedding"
                  className="w-full"
                  aria-invalid={Boolean(errors.weddingId)}
                  aria-describedby={errors.weddingId ? 't-wedding-error' : undefined}
                >
                  <SelectValue placeholder="Sélectionnez un mariage" />
                </SelectTrigger>
                <SelectContent>
                  {weddings.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.coupleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Prestataire associé" htmlFor="t-vendor" optional>
              <Select
                value={values.vendorId || 'aucun'}
                onValueChange={(v) => setField('vendorId', v === 'aucun' ? '' : v)}
                disabled={!values.weddingId}
              >
                <SelectTrigger id="t-vendor" className="w-full">
                  <SelectValue placeholder="Sélectionnez un mariage d'abord" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun</SelectItem>
                  {vendorsForWedding.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Date d'échéance" htmlFor="t-due" error={errors.dueDate}>
            <Input
              id="t-due"
              type="date"
              value={values.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 't-due-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Date de début" htmlFor="t-start" optional>
              <Input id="t-start" type="date" value={values.startDate} onChange={(e) => setField('startDate', e.target.value)} />
            </Field>
            <Field label="Date de fin" htmlFor="t-end" optional>
              <Input id="t-end" type="date" value={values.endDate} onChange={(e) => setField('endDate', e.target.value)} />
            </Field>
          </div>

          {task && task.postponeHistory.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Historique des reports ({task.postponeHistory.length})</p>
              {task.postponeHistory
                .slice()
                .reverse()
                .map((entry, i) => (
                  <p key={i}>
                    Du {formatShortDate(entry.fromDate)} au{' '}
                    {formatShortDate(entry.toDate)}
                    {entry.reason ? ` — ${entry.reason}` : ''}
                  </p>
                ))}
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Priorité" htmlFor="t-priority" error={errors.priority}>
              <Select value={values.priority} onValueChange={(v) => setField('priority', v)}>
                <SelectTrigger
                  id="t-priority"
                  className="w-full"
                  aria-invalid={Boolean(errors.priority)}
                  aria-describedby={errors.priority ? 't-priority-error' : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Statut" htmlFor="t-status" error={errors.status}>
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger
                  id="t-status"
                  className="w-full"
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? 't-status-error' : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {values.status === 'en_attente' && (
            <div className="grid gap-4 rounded-lg border border-border bg-muted/40 p-3 grid-cols-1 sm:grid-cols-2">
              <Field label="En attente de" htmlFor="t-waiting-on" optional>
                <Select value={values.waitingOn || 'aucun'} onValueChange={(v) => setField('waitingOn', v === 'aucun' ? '' : v)}>
                  <SelectTrigger id="t-waiting-on" className="w-full">
                    <SelectValue placeholder="Non précisé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aucun">Non précisé</SelectItem>
                    {TASK_WAITING_ON_OPTIONS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {TASK_WAITING_ON_LABELS[w]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Motif de l'attente" htmlFor="t-waiting-reason" optional>
                <Input id="t-waiting-reason" value={values.waitingReason} onChange={(e) => setField('waitingReason', e.target.value)} />
              </Field>
            </div>
          )}

          <Field label="Phase du jour J" htmlFor="t-phase" optional>
            <Select value={values.phase || 'aucune'} onValueChange={(v) => setField('phase', v === 'aucune' ? '' : v)}>
              <SelectTrigger id="t-phase" className="w-full">
                <SelectValue placeholder="Non classée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucune">Non classée</SelectItem>
                {DAY_PHASE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {DAY_PHASE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Notes" htmlFor="t-notes" optional>
            <Textarea id="t-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Créer la tâche'}</Button>
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
      <Label htmlFor={htmlFor} className="whitespace-nowrap">
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
