import { FileText, Hourglass, Inbox, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import { LEAD_STATUS_LABELS, type LeadStatusSchema } from '@/schemas/lead'
import type { z } from 'zod'

type LeadStatus = z.infer<typeof LeadStatusSchema>

const TONE: Record<LeadStatus, BadgeTone> = {
  nouveau: 'muted',
  repondu: 'muted',
  en_attente_reponse: 'warning',
  devis_envoye: 'success',
  importe: 'success',
  ignore: 'risk',
}

const ICON: Record<LeadStatus, typeof Inbox> = {
  nouveau: Inbox,
  repondu: MessageCircle,
  en_attente_reponse: Hourglass,
  devis_envoye: FileText,
  importe: FileText,
  ignore: FileText,
}

/** Même convention que ProposalStatusBadge/VendorStatusBadge : jamais uniquement la couleur, icône + texte toujours présents. */
export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('w-fit border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  )
}
