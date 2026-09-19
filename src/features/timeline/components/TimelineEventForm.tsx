import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  emptyTimelineEventFormValues,
  TimelineEventFormSchema,
  type TimelineEventFormValues,
} from '@/features/timeline/timelineEventForm.schema'
import { resolveTimeRange } from '@/features/timeline/timeRange'
import { DAY_PHASE_LABELS, DAY_PHASE_OPTIONS } from '@/lib/dayPhase'
import { TIMELINE_EVENT_STATUS_LABELS, TIMELINE_EVENT_STATUS_OPTIONS } from '@/lib/timelineEventStatus'
import type { TimelineEvent, Vendor } from '@/types/entities'

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  jalon: 'Jalon de préparation',
  jour_j: 'Jour J',
  livraison_prestataire: 'Livraison prestataire',
}

interface TimelineEventFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: TimelineEvent | null
  defaultDate?: string
  vendors: Vendor[]
  onSubmit: (values: TimelineEventFormValues) => void
}

function toFormValues(event: TimelineEvent): TimelineEventFormValues {
  return {
    title: event.title,
    description: event.description ?? '',
    date: event.date.slice(0, 10),
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    location: event.location ?? '',
    vendorId: event.vendorId ?? '',
    responsiblePerson: event.responsiblePerson ?? '',
    isPhotoMoment: event.isPhotoMoment,
    bufferBeforeMinutes: event.bufferBeforeMinutes !== undefined ? String(event.bufferBeforeMinutes) : '',
    bufferAfterMinutes: event.bufferAfterMinutes !== undefined ? String(event.bufferAfterMinutes) : '',
    type: event.type,
    status: event.status,
    notes: event.notes ?? '',
    phase: event.phase ?? '',
  }
}

/** Le parent doit remonter ce composant (prop `key`) à chaque ouverture — même convention que VendorForm/TaskForm. */
export function TimelineEventForm({ open, onOpenChange, event, defaultDate, vendors, onSubmit }: TimelineEventFormProps) {
  const isEdit = Boolean(event)
  const [values, setValues] = useState<TimelineEventFormValues>(() =>
    event ? toFormValues(event) : emptyTimelineEventFormValues(defaultDate),
  )
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const setField = <K extends keyof TimelineEventFormValues>(key: K, value: TimelineEventFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const timeRange = resolveTimeRange(values.startTime, values.endTime)
  const computedDuration = timeRange && timeRange.durationMinutes > 0 ? timeRange.durationMinutes : null

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = TimelineEventFormSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
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
          <DialogTitle>{isEdit ? 'Modifier le moment' : 'Ajouter un moment'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations de ce moment.' : 'Renseignez les informations essentielles.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
          <Field label="Nom du moment" htmlFor="e-title" error={errors.title}>
            <Input
              id="e-title"
              placeholder="Ex. Installation de la décoration"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'e-title-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Type de moment" htmlFor="e-type">
              <Select value={values.type} onValueChange={(v) => setField('type', v as TimelineEventFormValues['type'])}>
                <SelectTrigger id="e-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as TimelineEvent['type'][]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Statut" htmlFor="e-status">
              <Select value={values.status} onValueChange={(v) => setField('status', v)}>
                <SelectTrigger id="e-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_EVENT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TIMELINE_EVENT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Field label="Date" htmlFor="e-date" error={errors.date}>
              <Input
                id="e-date"
                type="date"
                value={values.date}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'e-date-error' : undefined}
              />
            </Field>
            <Field label="Heure de début" htmlFor="e-start" error={errors.startTime}>
              <Input
                id="e-start"
                type="time"
                value={values.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={errors.startTime ? 'e-start-error' : undefined}
              />
            </Field>
            <Field label="Heure de fin" htmlFor="e-end" error={errors.endTime}>
              <Input
                id="e-end"
                type="time"
                value={values.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={errors.endTime ? 'e-end-error' : undefined}
              />
            </Field>
          </div>

          <p className="text-xs text-muted-foreground">
            Durée{' '}
            {computedDuration !== null
              ? `: ${computedDuration} minutes${timeRange?.crossesMidnight ? ' (se termine le lendemain)' : ''}`
              : 'calculée automatiquement une fois les deux heures renseignées.'}
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Lieu" htmlFor="e-location" optional>
              <Input id="e-location" value={values.location} onChange={(e) => setField('location', e.target.value)} />
            </Field>
            <Field label="Prestataire associé" htmlFor="e-vendor" optional>
              <Select value={values.vendorId || 'aucun'} onValueChange={(v) => setField('vendorId', v === 'aucun' ? '' : v)}>
                <SelectTrigger id="e-vendor" className="w-full">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Responsable" htmlFor="e-responsible" optional>
            <Input id="e-responsible" value={values.responsiblePerson} onChange={(e) => setField('responsiblePerson', e.target.value)} />
          </Field>

          <div className="flex items-center gap-2">
            <Checkbox
              id="e-photo"
              checked={values.isPhotoMoment}
              onCheckedChange={(checked) => setField('isPhotoMoment', checked === true)}
            />
            <Label htmlFor="e-photo" className="font-normal">
              Marquer comme moment photo
            </Label>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Marge de sécurité avant" htmlFor="e-buffer-before" error={errors.bufferBeforeMinutes} optional>
              <Input
                id="e-buffer-before"
                inputMode="numeric"
                placeholder="Ex. 15 minutes"
                value={values.bufferBeforeMinutes}
                onChange={(e) => setField('bufferBeforeMinutes', e.target.value)}
                aria-invalid={Boolean(errors.bufferBeforeMinutes)}
                aria-describedby={errors.bufferBeforeMinutes ? 'e-buffer-before-error' : undefined}
              />
            </Field>
            <Field label="Marge de sécurité après" htmlFor="e-buffer-after" error={errors.bufferAfterMinutes} optional>
              <Input
                id="e-buffer-after"
                inputMode="numeric"
                placeholder="Ex. 15 minutes"
                value={values.bufferAfterMinutes}
                onChange={(e) => setField('bufferAfterMinutes', e.target.value)}
                aria-invalid={Boolean(errors.bufferAfterMinutes)}
                aria-describedby={errors.bufferAfterMinutes ? 'e-buffer-after-error' : undefined}
              />
            </Field>
          </div>

          <Field label="Phase du jour J" htmlFor="e-phase" optional>
            <Select value={values.phase || 'aucune'} onValueChange={(v) => setField('phase', v === 'aucune' ? '' : v)}>
              <SelectTrigger id="e-phase" className="w-full">
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

          <Field label="Notes" htmlFor="e-notes" optional>
            <Textarea id="e-notes" rows={2} value={values.notes} onChange={(e) => setField('notes', e.target.value)} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{isEdit ? 'Enregistrer' : 'Ajouter le moment'}</Button>
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
