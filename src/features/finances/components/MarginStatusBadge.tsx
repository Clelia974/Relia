import { CircleCheck, OctagonAlert, TrendingDown, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MARGIN_STATUS_LABELS, type MarginStatus } from '@/features/finances/calculations'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'

const TONE: Record<MarginStatus, BadgeTone> = {
  saine: 'success',
  a_surveiller: 'warning',
  faible: 'risk',
  critique: 'risk',
}

const ICON: Record<MarginStatus, typeof CircleCheck> = {
  saine: CircleCheck,
  a_surveiller: TriangleAlert,
  faible: TrendingDown,
  critique: OctagonAlert,
}

/** Jamais uniquement la couleur : texte + icône toujours présents (cf. Phase 8, section 3). */
export function MarginStatusBadge({ status }: { status: MarginStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {MARGIN_STATUS_LABELS[status]}
    </Badge>
  )
}
