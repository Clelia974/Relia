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

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge className={cn('w-fit border-transparent font-medium', toneClass(TONE[status]))}>{PROPOSAL_STATUS_LABELS[status]}</Badge>
}
