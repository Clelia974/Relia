import { differenceInCalendarDays } from 'date-fns'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import type { Vendor, VendorWeddingLink } from '@/types/entities'

export type VendorUrgency = 'urgent' | 'attention' | 'normal'

/**
 * Urgence d'un prestataire non confirmé selon la proximité du mariage.
 * Un prestataire déjà confirmé n'a plus d'urgence (retourne null).
 */
export function computeVendorUrgency(vendor: Vendor, weddingDate: string): VendorUrgency | null {
  if (isVendorConfirmed(vendor.status)) return null

  const daysUntil = differenceInCalendarDays(new Date(weddingDate), new Date())
  if (daysUntil <= 3) return 'urgent'
  if (daysUntil <= 14) return 'attention'
  return 'normal'
}

export function countTotal(vendors: Vendor[]): number {
  return vendors.length
}

export function countConfirmed(vendors: Vendor[]): number {
  return vendors.filter((v) => isVendorConfirmed(v.status)).length
}

export function countUnconfirmed(vendors: Vendor[]): number {
  return vendors.filter((v) => !isVendorConfirmed(v.status)).length
}

export function countMissingArrivalTime(vendors: Vendor[]): number {
  return vendors.filter((v) => !v.arrivalTime).length
}

/** `vendorLinks` doit être pré-filtré sur le même périmètre (mariage) que `vendors`. */
export function countMissingCost(vendors: Vendor[], vendorLinks: VendorWeddingLink[]): number {
  const linkedVendorIds = new Set(
    vendorLinks.filter((l) => l.estimatedCost !== undefined || l.actualCost !== undefined).map((l) => l.vendorId),
  )
  return vendors.filter((v) => !linkedVendorIds.has(v.id)).length
}

export function findNextVendorToContact(vendors: Vendor[], weddingDate: string): Vendor | null {
  const unconfirmed = vendors.filter((v) => !isVendorConfirmed(v.status))
  if (unconfirmed.length === 0) return null

  const rank: Record<VendorUrgency, number> = { urgent: 0, attention: 1, normal: 2 }
  return [...unconfirmed].sort((a, b) => {
    const ra = rank[computeVendorUrgency(a, weddingDate) ?? 'normal']
    const rb = rank[computeVendorUrgency(b, weddingDate) ?? 'normal']
    return ra - rb
  })[0]
}

export function hasUrgentVendor(vendors: Vendor[], weddingDate: string): boolean {
  return vendors.some((v) => computeVendorUrgency(v, weddingDate) === 'urgent')
}
