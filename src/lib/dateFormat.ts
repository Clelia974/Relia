export function formatDaysUntil(daysUntil: number): string {
  if (daysUntil === 0) return "Aujourd'hui"
  if (daysUntil > 0) return `J-${daysUntil}`
  return `J+${Math.abs(daysUntil)}`
}
