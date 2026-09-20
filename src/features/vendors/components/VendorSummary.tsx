import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { countConfirmed, countMissingArrivalTime, countTotal, countUnconfirmed } from '@/features/vendors/summary'
import type { VendorAssignment } from '@/features/vendors/assignments'

export function VendorSummary({ vendors }: { vendors: VendorAssignment[] }) {
  const total = countTotal(vendors)
  const confirmed = countConfirmed(vendors)
  const needed = countUnconfirmed(vendors)
  const missingArrival = countMissingArrivalTime(vendors)

  return (
    <Card className="w-full sm:w-auto">
      <CardContent className="flex flex-col gap-1.5 text-sm">
        <p className="font-medium text-foreground">
          {confirmed}/{total} prestataire{total !== 1 ? 's' : ''} confirmé{total !== 1 ? 's' : ''}
        </p>
        <p className={cn(needed > 0 ? 'text-warning' : 'text-muted-foreground')}>
          {needed} confirmation{needed !== 1 ? 's' : ''} à obtenir
        </p>
        <p className={cn(missingArrival > 0 ? 'text-warning' : 'text-muted-foreground')}>
          {missingArrival} horaire{missingArrival !== 1 ? 's' : ''} d'arrivée manquant{missingArrival !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
