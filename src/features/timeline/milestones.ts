/** Jalons de la frise de préparation, du plus lointain au jour J (0). */
export const PREPARATION_MILESTONES = [90, 60, 30, 14, 7, 3, 0] as const

export type PreparationMilestone = (typeof PREPARATION_MILESTONES)[number]

export const MILESTONE_LABELS: Record<PreparationMilestone, string> = {
  90: 'J-90',
  60: 'J-60',
  30: 'J-30',
  14: 'J-14',
  7: 'J-7',
  3: 'J-3',
  0: 'Jour J',
}

const MILESTONES_ASC = [...PREPARATION_MILESTONES].reverse()

/**
 * Regroupe une échéance sous le prochain jalon à venir : une tâche à 45 jours
 * du mariage tombe dans le segment "J-60" (entre J-60 et J-30). Une échéance
 * dépassée ou le jour même tombe dans "Jour J".
 */
export function milestoneBucket(daysBeforeWedding: number): PreparationMilestone {
  if (daysBeforeWedding <= 0) return 0
  for (const milestone of MILESTONES_ASC) {
    if (daysBeforeWedding <= milestone) return milestone
  }
  return 90
}
