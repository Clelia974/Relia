import { FileEdit, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { INVOICE_STATUS_LABELS } from '@/lib/invoiceStatus'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types/entities'

const TONE: Record<InvoiceStatus, BadgeTone> = {
  brouillon: 'muted',
  finalisee: 'success',
}

const ICON: Record<InvoiceStatus, typeof FileEdit> = {
  brouillon: FileEdit,
  finalisee: Lock,
}

/** Jamais uniquement la couleur : icône + texte toujours présents (même convention que ProposalStatusBadge). */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('w-fit border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}
