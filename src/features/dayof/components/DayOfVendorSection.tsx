import { Clock, Mail, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { VendorStatusBadge } from '@/features/vendors/components/VendorStatusBadge'
import type { VendorAssignment } from '@/features/vendors/assignments'
import { cn } from '@/lib/utils'

interface DayOfVendorSectionProps {
  /** Affectations (fiche + lien au mariage) de tous les prestataires de ce mariage — pas seulement ceux ayant un moment planning ce jour-là : le statut/horaire d'un prestataire doit rester visible même sans événement associé. */
  assignments: VendorAssignment[]
}

/** Trie par heure d'arrivée croissante ; les prestataires sans horaire renseigné passent en dernier (ils demandent une relance, pas une consultation urgente). */
function sortByArrival(assignments: VendorAssignment[]): VendorAssignment[] {
  return [...assignments].sort((a, b) => {
    if (!a.link.arrivalTime && !b.link.arrivalTime) return a.vendor.name.localeCompare(b.vendor.name)
    if (!a.link.arrivalTime) return 1
    if (!b.link.arrivalTime) return -1
    return a.link.arrivalTime.localeCompare(b.link.arrivalTime)
  })
}

/**
 * Statut et horaire d'arrivée de chaque prestataire du mariage, pour la Vue
 * Jour J — absent jusqu'ici : seuls les prestataires liés à un moment
 * planning du jour apparaissaient (via DayOfItemCard), un prestataire
 * confirmé sans événement associé restait invisible.
 */
export function DayOfVendorSection({ assignments }: DayOfVendorSectionProps) {
  const sorted = sortByArrival(assignments)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Prestataires du jour J</h2>

      {sorted.length === 0 ? (
        <EmptyState description="Aucun prestataire affecté à ce mariage." />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(({ vendor, link }) => (
            <Card key={vendor.id}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.category}</p>
                  </div>
                  <VendorStatusBadge status={link.status} />
                </div>

                <span className={cn('flex items-center gap-1.5 text-xs', link.arrivalTime ? 'text-muted-foreground' : 'font-medium text-warning')}>
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  {link.arrivalTime ?? 'Horaire non renseigné'}
                </span>

                {(vendor.phone || vendor.email) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    {vendor.phone && (
                      <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 text-thread-text hover:underline">
                        <Phone className="size-3.5" aria-hidden="true" />
                        Appeler
                      </a>
                    )}
                    {vendor.email && (
                      <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 text-thread-text hover:underline">
                        <Mail className="size-3.5" aria-hidden="true" />
                        Email
                      </a>
                    )}
                  </div>
                )}

                {link.notes && <p className="text-xs text-muted-foreground">{link.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
