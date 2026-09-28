/**
 * Ce pour quoi un devis est construit — un mariage (le cas d'origine) ou
 * une demande pas encore signée (aucun mariage n'existe encore). Le
 * constructeur de devis (ProposalBuilderPage) ne connaît que cette forme
 * minimale, jamais l'entité complète : même éditeur, même calculs, même
 * aperçu, quelle que soit l'origine.
 */
export interface ProposalSubject {
  coupleName: string
  date: string
  venue: string
  clientAddress?: string
  clientPhone?: string
  /** Lien "← Documents" / "← Demandes reçues", et cible après suppression. */
  backHref: string
  backLabel: string
  /** Lien vers CE devis précis (pour la duplication, qui en crée un nouveau). */
  proposalHref: (proposalId: string) => string
}
