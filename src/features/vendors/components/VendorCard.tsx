import { Clock, Mail, MoreHorizontal, Phone, TriangleAlert } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CostReviewBadge } from '@/components/CostReviewBadge'
import { InitialsBadge } from '@/components/InitialsBadge'
import { VendorStatusBadge } from '@/features/vendors/components/VendorStatusBadge'
import { computeVendorUrgency } from '@/features/vendors/summary'
import { currency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import type { VendorAssignment } from '@/features/vendors/assignments'
import type { Vendor } from '@/types/entities'

interface VendorCardProps {
  /** Le prestataire vu à travers son affectation à LE mariage affiché : statut, horaire, coûts et notes viennent du lien, jamais de la fiche globale. */
  assignment: VendorAssignment
  weddingDate: string
  onViewProfile: (vendor: Vendor) => void
  onEditAssignment: (assignment: VendorAssignment) => void
  onDelete: (vendor: Vendor) => void
  onMarkConfirmed: (assignment: VendorAssignment) => void
}

export function VendorCard({ assignment, weddingDate, onViewProfile, onEditAssignment, onDelete, onMarkConfirmed }: VendorCardProps) {
  const { vendor, link } = assignment
  const confirmed = isVendorConfirmed(link.status)
  const urgency = computeVendorUrgency(assignment, weddingDate)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <InitialsBadge name={vendor.name} />
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-semibold text-foreground">{vendor.name}</p>
              {vendor.company && <p className="truncate text-xs text-muted-foreground">{vendor.company}</p>}
            </div>
          </div>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions pour ${vendor.name}`}
                    className="shrink-0 relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-accent-foreground"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onViewProfile(vendor)}>Voir la fiche catalogue</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEditAssignment(assignment)}>Modifier l'affectation</DropdownMenuItem>
              {!confirmed && (
                <DropdownMenuItem onSelect={() => onMarkConfirmed(assignment)}>Marquer comme confirmé</DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(vendor)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{vendor.category}</span>
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <VendorStatusBadge status={link.status} />
          {!confirmed && urgency === 'urgent' && (
            <span className="flex items-center gap-1 text-xs font-medium text-risk">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              Confirmation urgente
            </span>
          )}
          {!confirmed && urgency === 'attention' && (
            <span className="flex items-center gap-1 text-xs font-medium text-warning">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              À relancer
            </span>
          )}
        </div>

        {(vendor.phone || vendor.email) && (
          <div className="flex flex-col gap-1 text-sm">
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 text-foreground hover:underline">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {vendor.phone}
              </a>
            )}
            {vendor.email && (
              <a href={`mailto:${vendor.email}`} className="flex items-center gap-1.5 truncate text-foreground hover:underline">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{vendor.email}</span>
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
          <span className={cn('flex items-center gap-1', link.arrivalTime ? 'text-muted-foreground' : 'text-warning font-medium')}>
            <Clock className="size-3.5" aria-hidden="true" />
            {link.arrivalTime ?? 'Horaire manquant'}
          </span>
          {link.estimatedCost !== undefined && (
            <span className="text-muted-foreground">Estimé {currency.format(link.estimatedCost)}</span>
          )}
          {link.actualCost !== undefined && (
            <span className="text-muted-foreground">Réel {currency.format(link.actualCost)}</span>
          )}
        </div>

        {link.notes && <p className="text-xs text-muted-foreground">{link.notes}</p>}

        {link.needsCostReview && <CostReviewBadge />}
      </CardContent>
    </Card>
  )
}
