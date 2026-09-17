import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskEmptyStateProps {
  title: string
  description: string
  onAdd?: () => void
}

export function TaskEmptyState({ title, description, onAdd }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-6 py-12">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Nouvelle tâche
        </Button>
      )}
    </div>
  )
}
