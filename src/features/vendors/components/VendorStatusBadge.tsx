import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { VENDOR_STATUS_LABELS } from '@/lib/vendorStatus'
import type { VendorStatus } from '@/types/entities'

const STATUS_TONE: Record<VendorStatus, string> = {
  a_contacter: 'bg-muted text-muted-foreground',
  contacte: 'bg-muted text-muted-foreground',
  devis_recu: 'bg-warning-bg text-warning',
  confirme: 'bg-success-bg text-success',
  acompte_paye: 'bg-success-bg text-success',
  solde_a_payer: 'bg-warning-bg text-warning',
  termine: 'bg-success-bg text-success',
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return <Badge className={cn('border-transparent font-medium', STATUS_TONE[status])}>{VENDOR_STATUS_LABELS[status]}</Badge>
}
