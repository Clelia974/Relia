import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Signale un coût dupliqué automatiquement par la migration v3→v4 pour un
 * prestataire partagé entre plusieurs mariages (VendorWeddingLink.needsCostReview) —
 * jamais présenté comme une valeur fiable tant qu'il n'a pas été vérifié.
 * Texte toujours visible (pas seulement un tooltip au survol) pour rester
 * accessible au clavier et au tactile.
 */
export function CostReviewBadge() {
  return (
    <div className="flex flex-col gap-1">
      <Badge className="w-fit border-transparent bg-warning-bg font-medium text-warning">
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        Coût à vérifier
      </Badge>
      <p className="text-xs text-muted-foreground">
        Ce coût a été repris automatiquement lors de la migration. Vérifiez qu'il correspond bien à ce mariage.
      </p>
    </div>
  )
}
