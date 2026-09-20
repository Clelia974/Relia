import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import { VENDOR_STATUS_LABELS } from '@/lib/vendorStatus'
import type { VendorStatus } from '@/types/entities'

const STATUS_TONE: Record<VendorStatus, BadgeTone> = {
  a_contacter: 'muted',
  contacte: 'muted',
  devis_recu: 'warning',
  confirme: 'muted',
  acompte_paye: 'muted',
  solde_a_payer: 'warning',
  termine: 'muted',
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return <Badge className={cn('border-transparent font-medium', toneClass(STATUS_TONE[status]))}>{VENDOR_STATUS_LABELS[status]}</Badge>
}
