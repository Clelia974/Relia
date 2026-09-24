import { ArrowRightLeft, Clock, EyeOff, Timer, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { TimelineConflict } from '@/features/timeline/conflicts'
import type { TimelineEvent } from '@/types/entities'

interface TimelineConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conflict: TimelineConflict | null
  events: TimelineEvent[]
  onEditEvent: (event: TimelineEvent) => void
  onIgnore: (conflict: TimelineConflict) => void
}

/**
 * Ne modifie jamais rien elle-même : chaque option ouvre le formulaire
 * concerné, déjà rempli, pour que l'utilisatrice confirme le changement.
 * Seule "Ignorer cette alerte" agit directement (elle n'édite aucune donnée).
 */
export function TimelineConflictDialog({ open, onOpenChange, conflict, events, onEditEvent, onIgnore }: TimelineConflictDialogProps) {
  if (!conflict) return null

  const involvedEvents = conflict.eventIds.map((id) => events.find((e) => e.id === id)).filter((e): e is TimelineEvent => Boolean(e))
  const [eventA, eventB] = involvedEvents

  const options: { label: string; icon: typeof Clock; onClick: () => void }[] = []

  if (eventA) {
    options.push({ label: `Déplacer « ${eventA.title} »`, icon: Clock, onClick: () => onEditEvent(eventA) })
  }
  if (eventB) {
    options.push({ label: `Déplacer « ${eventB.title} »`, icon: Clock, onClick: () => onEditEvent(eventB) })
  }
  if (conflict.type === 'buffer_insuffisant' || conflict.type === 'transition_impossible') {
    if (eventA) options.push({ label: `Augmenter la marge après « ${eventA.title} »`, icon: Timer, onClick: () => onEditEvent(eventA) })
  }
  if (conflict.type === 'duree_incoherente' && eventA) {
    options.push({ label: `Modifier la durée de « ${eventA.title} »`, icon: Timer, onClick: () => onEditEvent(eventA) })
  }
  if (conflict.type === 'prestataire_conflit' && eventB) {
    options.push({ label: `Changer le prestataire de « ${eventB.title} »`, icon: Users, onClick: () => onEditEvent(eventB) })
  }
  if (conflict.type === 'prestataire_manquant' && eventA) {
    options.push({ label: `Associer un prestataire à « ${eventA.title} »`, icon: Users, onClick: () => onEditEvent(eventA) })
  }
  if (conflict.type === 'transition_impossible' && eventB) {
    options.push({ label: `Rapprocher les lieux de « ${eventB.title} »`, icon: ArrowRightLeft, onClick: () => onEditEvent(eventB) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conflit de planning</DialogTitle>
          <DialogDescription className="whitespace-pre-line">{conflict.message}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Suggestion : </span>
          {conflict.suggestion}
        </p>

        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <Button key={option.label} variant="outline" className="justify-start" onClick={option.onClick}>
              <option.icon className="size-4" aria-hidden="true" />
              {option.label}
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="text-muted-foreground" onClick={() => onIgnore(conflict)}>
            <EyeOff className="size-4" aria-hidden="true" />
            Ignorer cette alerte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
