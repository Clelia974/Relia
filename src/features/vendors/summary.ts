import { differenceInCalendarDays } from 'date-fns'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import type { VendorAssignment } from '@/features/vendors/assignments'

export type VendorUrgency = 'urgent' | 'attention' | 'normal'

/**
 * Urgence d'un prestataire non confirmé selon la proximité du mariage.
 * Un prestataire déjà confirmé n'a plus d'urgence (retourne null).
 */
export function computeVendorUrgency(assignment: VendorAssignment, weddingDate: string): VendorUrgency | null {
  if (isVendorConfirmed(assignment.link.status)) return null

  const daysUntil = differenceInCalendarDays(new Date(weddingDate), new Date())
  if (daysUntil <= 3) return 'urgent'
  if (daysUntil <= 14) return 'attention'
  return 'normal'
}

export function countTotal(vendors: VendorAssignment[]): number {
  return vendors.length
}

export function countConfirmed(vendors: VendorAssignment[]): number {
  return vendors.filter((a) => isVendorConfirmed(a.link.status)).length
}

export function countUnconfirmed(vendors: VendorAssignment[]): number {
  return vendors.filter((a) => !isVendorConfirmed(a.link.status)).length
}

export function countMissingArrivalTime(vendors: VendorAssignment[]): number {
  return vendors.filter((a) => !a.link.arrivalTime).length
}

export function countMissingCost(vendors: VendorAssignment[]): number {
  return vendors.filter((a) => a.link.estimatedCost === undefined && a.link.actualCost === undefined).length
}

export function findNextVendorToContact(vendors: VendorAssignment[], weddingDate: string): VendorAssignment | null {
  const unconfirmed = vendors.filter((a) => !isVendorConfirmed(a.link.status))
  if (unconfirmed.length === 0) return null

  const rank: Record<VendorUrgency, number> = { urgent: 0, attention: 1, normal: 2 }
  return [...unconfirmed].sort((a, b) => {
    const ra = rank[computeVendorUrgency(a, weddingDate) ?? 'normal']
    const rb = rank[computeVendorUrgency(b, weddingDate) ?? 'normal']
    return ra - rb
  })[0]
}

export function hasUrgentVendor(vendors: VendorAssignment[], weddingDate: string): boolean {
  return vendors.some((a) => computeVendorUrgency(a, weddingDate) === 'urgent')
}
