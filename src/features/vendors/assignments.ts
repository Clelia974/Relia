import type { Vendor, VendorWeddingLink } from '@/types/entities'

/** Un prestataire vu à travers son affectation à UN mariage : fiche globale + lien propre à ce mariage. */
export interface VendorAssignment {
  vendor: Vendor
  link: VendorWeddingLink
}

/** Affectation par défaut (non persistée) pour un lien manquant — ex. données antérieures à la migration v11. */
export function defaultLink(vendorId: string, weddingId: string): VendorWeddingLink {
  return { id: `virtual:${vendorId}:${weddingId}`, vendorId, weddingId, status: 'a_contacter' }
}

export function resolveAssignment(vendor: Vendor, links: VendorWeddingLink[], weddingId: string): VendorAssignment {
  const link = links.find((l) => l.vendorId === vendor.id && l.weddingId === weddingId) ?? defaultLink(vendor.id, weddingId)
  return { vendor, link }
}

export function getWeddingAssignments(vendors: Vendor[], links: VendorWeddingLink[], weddingId: string): VendorAssignment[] {
  return vendors.filter((v) => v.weddingIds.includes(weddingId)).map((v) => resolveAssignment(v, links, weddingId))
}

export function getVendorAssignments(vendor: Vendor, links: VendorWeddingLink[]): VendorAssignment[] {
  return vendor.weddingIds.map((weddingId) => resolveAssignment(vendor, links, weddingId))
}
