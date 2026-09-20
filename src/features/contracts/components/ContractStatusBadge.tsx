import { CircleCheck, FilePen, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { CONTRACT_STATUS_LABELS } from '@/lib/contractStatus'
import { cn } from '@/lib/utils'
import type { ContractStatus } from '@/types/entities'

const TONE: Record<ContractStatus, BadgeTone> = { a_rediger: 'muted', envoye: 'warning', signe: 'success' }
const ICON: Record<ContractStatus, typeof FilePen> = { a_rediger: FilePen, envoye: Send, signe: CircleCheck }

/** Toujours une icône et un texte : jamais la couleur seule. */
export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const Icon = ICON[status]
  return (
    <Badge className={cn('border-transparent font-medium', toneClass(TONE[status]))}>
      <Icon className="size-3.5" aria-hidden="true" />
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  )
}
