import { EmptyState } from '@/components/EmptyState'

interface TaskEmptyStateProps {
  title: string
  description: string
  onAdd?: () => void
}

export function TaskEmptyState({ title, description, onAdd }: TaskEmptyStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onAdd ? { label: 'Nouvelle tâche', onClick: onAdd } : undefined}
    />
  )
}
