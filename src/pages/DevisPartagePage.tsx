import { Link, useParams } from 'react-router-dom'
import { ProposalDocumentPreview } from '@/features/proposals/components/ProposalDocumentPreview'
import { useDevisPartage } from '@/features/proposals/useDevisPartage'

/**
 * Page publique (jamais authentifiée) affichant un devis envoyé par une
 * décoratrice — /devis/:shareId, lien communiqué par email (cf.
 * api/devis/share.ts). Réutilise ProposalDocumentPreview telle quelle :
 * même rendu que dans l'éditeur, sans aucune donnée du compte au-delà de
 * l'instantané figé au moment de l'envoi.
 */
export function DevisPartagePage() {
  const { shareId } = useParams<{ shareId: string }>()
  const { snapshot, isLoading, error } = useDevisPartage(shareId)

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="Relia — retour à l'accueil">
            <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
            <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
          </Link>
        </div>
      </header>

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
