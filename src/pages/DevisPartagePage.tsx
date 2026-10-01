import { useParams } from 'react-router-dom'
import { ProposalDocumentPreview } from '@/features/proposals/components/ProposalDocumentPreview'
import { useDevisPartage } from '@/features/proposals/useDevisPartage'

/**
 * Page publique (jamais authentifiée) affichant un devis envoyé par une
 * décoratrice — /devis/:shareId, lien communiqué par email (cf.
 * api/devis/share.ts). Réutilise ProposalDocumentPreview telle quelle :
 * même rendu que dans l'éditeur, sans aucune donnée du compte au-delà de
 * l'instantané figé au moment de l'envoi. Aucun en-tête SilkyPlace : la cliente
 * ne doit voir que sa décoratrice (nom/logo déjà affichés par
 * ProposalDocumentPreview elle-même), jamais la marque de la plateforme.
 */
export function DevisPartagePage() {
  const { shareId } = useParams<{ shareId: string }>()
  const { snapshot, isLoading, error } = useDevisPartage(shareId)

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement du devis…</p>}
        {!isLoading && error && <p className="text-sm text-risk">{error}</p>}
        {!isLoading && snapshot && (
          <ProposalDocumentPreview
            businessConfig={snapshot.businessConfig}
            wedding={snapshot.wedding}
            title={snapshot.title}
            proposalNumber={snapshot.proposalNumber}
            templateLabel={snapshot.templateLabel}
            clientName={snapshot.clientName}
            clientAddress={snapshot.clientAddress}
            clientPhone={snapshot.clientPhone}
            validUntil={snapshot.validUntil}
            lineItems={snapshot.lineItems}
            totals={snapshot.totals}
            vatMode={snapshot.vatMode}
            vatRate={snapshot.vatRate}
            depositPercentage={snapshot.depositPercentage}
            notes={snapshot.notes}
          />
        )}
      </main>
    </div>
  )
}
