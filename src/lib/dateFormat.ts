import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDaysUntil(daysUntil: number): string {
  if (daysUntil === 0) return "Aujourd'hui"
  if (daysUntil > 0) return `J-${daysUntil}`
  return `J+${Math.abs(daysUntil)}`
}

/** Date courte partagée (ex. "3 janv. 2027") — même format et locale que les usages historiques répétés. */
export function formatShortDate(date: string | Date): string {
  return format(typeof date === 'string' ? new Date(date) : date, 'd MMM yyyy', { locale: fr })
}
