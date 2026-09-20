import { CircleCheck, CircleHelp, OctagonAlert, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BUDGET_STATUS_LABELS, type BudgetStatus } from '@/features/finances/budget'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'

const TONE: Record<BudgetStatus, BadgeTone> = {
  non_configure: 'muted',
  ok: 'success',
  attention: 'warning',
  depasse: 'risk',
}

const ICON: Record<BudgetStatus, typeof CircleCheck> = {
  non_configure: CircleHelp,
  ok: CircleCheck,
  attention: TriangleAlert,
  depasse: OctagonAlert,
}

/** Jamais uniquement la couleur : texte + icône toujours présents (même convention que MarginStatusBadge). */
export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {BUDGET_STATUS_LABELS[status]}
    </Badge>
  )
}
