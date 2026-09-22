import { Badge } from '@/components/ui/badge'
import type { SubscriptionAccessStatus } from '@/features/payment/subscriptionAccess'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<SubscriptionAccessStatus, BadgeTone> = {
  trial: 'muted',
  grace: 'warning',
  expired: 'warning',
  active: 'success',
  cancelled: 'warning',
}

const STATUS_LABEL: Record<SubscriptionAccessStatus, string> = {
  trial: 'Essai Pro en cours',
  grace: 'Essai Pro terminé',
  expired: 'Version Gratuite',
  active: 'Pro actif',
  cancelled: 'Abonnement annulé',
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionAccessStatus }) {
  return <Badge className={cn('border-transparent font-medium', toneClass(STATUS_TONE[status]))}>{STATUS_LABEL[status]}</Badge>
}
