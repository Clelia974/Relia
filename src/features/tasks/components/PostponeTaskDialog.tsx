import { type FormEvent, useRef, useState } from 'react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/entities'

interface PostponeTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onConfirm: (newDueDate: string, reason?: string) => void
}

function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

const SHORTCUTS = [
  { label: 'Demain', compute: () => addDays(new Date(), 1) },
  { label: 'Dans 3 jours', compute: () => addDays(new Date(), 3) },
  { label: 'La semaine prochaine', compute: () => addDays(new Date(), 7) },
]

export function PostponeTaskDialog({ open, onOpenChange, task, onConfirm }: PostponeTaskDialogProps) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const applyShortcut = (label: string, computeDate: () => Date) => {
    setDate(toDateInputValue(computeDate()))
    setSelectedShortcut(label)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!date || !task) return
    onConfirm(new Date(date).toISOString(), reason.trim() || undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporter la tâche</DialogTitle>
          <DialogDescription>{task?.title}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-wrap gap-1.5">
            {SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => applyShortcut(shortcut.label, shortcut.compute)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedShortcut === shortcut.label
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {shortcut.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedShortcut('Choisir une date')
                dateInputRef.current?.focus()
                dateInputRef.current?.showPicker?.()
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                selectedShortcut === 'Choisir une date'
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              Choisir une date
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postpone-date">Nouvelle date d'échéance</Label>
            <Input
              id="postpone-date"
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setSelectedShortcut(null)
              }}
              required
            />
            {date && <p className="text-xs text-muted-foreground">Reportée au {format(new Date(date), 'd MMMM yyyy', { locale: fr })}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="postpone-reason">
              Motif du report <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Input id="postpone-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. En attente d'un retour du prestataire" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!date}>
              Reporter la tâche
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
