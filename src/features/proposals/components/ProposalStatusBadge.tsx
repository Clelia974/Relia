import { CircleCheck, CircleX, FileClock, FileEdit, Hourglass, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { PROPOSAL_STATUS_LABELS } from '@/lib/proposalStatus'
import { cn } from '@/lib/utils'
import type { ProposalStatus } from '@/types/entities'

const TONE: Record<ProposalStatus, BadgeTone> = {
  brouillon: 'muted',
  a_envoyer: 'muted',
  envoyee: 'warning',
  en_attente_approbation: 'warning',
  approuvee: 'success',
  rejetee: 'risk',
  expiree: 'risk',
}

const ICON: Record<ProposalStatus, typeof FileEdit> = {
  brouillon: FileEdit,
  a_envoyer: Send,
  envoyee: Send,
  en_attente_approbation: Hourglass,
  approuvee: CircleCheck,
  rejetee: CircleX,
  expiree: FileClock,
}

/** Jamais uniquement la couleur : icône + texte toujours présents (même convention que MarginStatusBadge/BudgetStatusBadge). */
export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('w-fit border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  )
}
