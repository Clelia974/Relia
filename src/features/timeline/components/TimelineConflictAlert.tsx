import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineConflict } from '@/features/timeline/conflicts'

interface TimelineConflictAlertProps {
  conflicts: TimelineConflict[]
  onSeeOptions: (conflict: TimelineConflict) => void
}

const CONFLICT_TITLES: Record<TimelineConflict['type'], string> = {
  chevauchement: 'Chevauchement de planning',
  buffer_insuffisant: 'Marge insuffisante',
  prestataire_conflit: 'Prestataire en double',
  duree_incoherente: 'Durée incohérente',
  prestataire_manquant: 'Prestataire manquant',
  transition_impossible: 'Transition difficile',
}

export function TimelineConflictAlert({ conflicts, onSeeOptions }: TimelineConflictAlertProps) {
  const visible = conflicts.filter((c) => !c.ignored)
  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {visible.map((conflict) => (
        <Alert
          key={conflict.id}
          className={cn(
            conflict.severity === 'critical' ? 'border-risk/40 bg-risk-bg' : 'border-warning/40 bg-warning-bg',
          )}
        >
          <TriangleAlert className={cn('size-4', conflict.severity === 'critical' ? 'text-risk' : 'text-warning')} aria-hidden="true" />
          <AlertTitle className={conflict.severity === 'critical' ? 'text-risk' : 'text-warning'}>
            {CONFLICT_TITLES[conflict.type]}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-line text-foreground/80">{conflict.message}</AlertDescription>
          <div className="mt-1">
            <Button size="sm" variant="outline" onClick={() => onSeeOptions(conflict)}>
              Voir les options
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
