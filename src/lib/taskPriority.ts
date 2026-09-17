import type { TaskPriority } from '@/types/entities'

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
}

export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ['normale', 'haute', 'urgente']
