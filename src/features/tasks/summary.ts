import { isBefore, isSameDay, startOfDay } from 'date-fns'
import type { Task } from '@/types/entities'

export function isOverdue(task: Task, today: Date = new Date()): boolean {
  if (!task.dueDate || task.status === 'terminee' || task.status === 'en_attente') return false
  return isBefore(startOfDay(new Date(task.dueDate)), startOfDay(today))
}

export function isDueToday(task: Task, today: Date = new Date()): boolean {
  if (!task.dueDate || task.status === 'terminee') return false
  return isSameDay(new Date(task.dueDate), today)
}

export function isCompletedToday(task: Task, today: Date = new Date()): boolean {
  return task.status === 'terminee' && Boolean(task.completedAt) && isSameDay(new Date(task.completedAt as string), today)
}

/**
 * Ordre d'affichage du dashboard (section "Aujourd'hui") :
 * 1. Urgentes en retard · 2. En retard (autre priorité) · 3. Urgentes du jour ·
 * 4. À échéance aujourd'hui · 5. Priorité haute · 6. Priorité normale.
 * Les tâches "En attente" et "Terminée" sont exclues — elles ont leurs propres sections.
 */
function taskTier(task: Task, today: Date): number {
  const overdue = isOverdue(task, today)
  const dueToday = isDueToday(task, today)
  if (overdue && task.priority === 'urgente') return 1
  if (overdue) return 2
  if (dueToday && task.priority === 'urgente') return 3
  if (dueToday) return 4
  if (task.priority === 'haute') return 5
  return 6
}

/** Tâches actives (ni en attente, ni terminées), triées par priorité d'affichage du dashboard. */
export function sortActiveTasksForDashboard(tasks: Task[], today: Date = new Date()): Task[] {
  return tasks
    .filter((t) => t.status !== 'en_attente' && t.status !== 'terminee')
    .sort((a, b) => {
      const tierDiff = taskTier(a, today) - taskTier(b, today)
      if (tierDiff !== 0) return tierDiff
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
}

export function findNextPriorityTask(tasks: Task[], today: Date = new Date()): Task | null {
  return sortActiveTasksForDashboard(tasks, today)[0] ?? null
}

export interface WeddingTaskStats {
  total: number
  open: number
  urgent: number
  waiting: number
  done: number
}

export function computeWeddingTaskStats(tasks: Task[]): WeddingTaskStats {
  return {
    total: tasks.length,
    open: tasks.filter((t) => t.status !== 'terminee').length,
    urgent: tasks.filter((t) => t.priority === 'urgente' && t.status !== 'terminee' && t.status !== 'en_attente').length,
    waiting: tasks.filter((t) => t.status === 'en_attente').length,
    done: tasks.filter((t) => t.status === 'terminee').length,
  }
}
