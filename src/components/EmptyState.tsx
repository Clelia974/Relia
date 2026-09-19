import type { ReactNode } from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
}

interface EmptyStateProps {
  /** Sans titre : message simple centré, pour "aucun résultat" / "rien pour ces filtres". */
  title?: string
  description: ReactNode
  action?: EmptyStateAction
  className?: string
}

/**
 * Bloc "rien à afficher" réutilisable — reprend telles quelles les deux
 * formes déjà répétées dans l'app : un simple message (sans titre), ou un
 * état "ajoutez votre premier X" avec titre + description + action.
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  if (!title) {
    return (
      <p
        className={cn(
          'rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        {description}
      </p>
    )
  }

  const Icon = action?.icon ?? Plus

  return (
    <div className={cn('flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-6 py-12', className)}>
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick}>
          <Icon className="size-4" aria-hidden="true" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
