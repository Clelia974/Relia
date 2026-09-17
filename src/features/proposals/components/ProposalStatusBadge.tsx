import { Badge } from '@/components/ui/badge'
import { PROPOSAL_STATUS_LABELS } from '@/lib/proposalStatus'
import { cn } from '@/lib/utils'
import type { ProposalStatus } from '@/types/entities'

const TONE: Record<ProposalStatus, string> = {
  brouillon: 'bg-muted text-muted-foreground',
  a_envoyer: 'bg-muted text-muted-foreground',
  envoyee: 'bg-warning-bg text-warning',
  en_attente_approbation: 'bg-warning-bg text-warning',
  approuvee: 'bg-success-bg text-success',
  rejetee: 'bg-risk-bg text-risk',
  expiree: 'bg-risk-bg text-risk',
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge className={cn('w-fit border-transparent font-medium', TONE[status])}>{PROPOSAL_STATUS_LABELS[status]}</Badge>
}
