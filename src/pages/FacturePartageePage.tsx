import { useParams } from 'react-router-dom'
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview'
import { useFacturePartagee } from '@/features/invoices/useFacturePartagee'

/**
 * Page publique (jamais authentifiée) affichant une facture envoyée par
 * une décoratrice — /facture/:shareId. Même principe que
 * DevisPartagePage.tsx : réutilise InvoiceDocumentPreview telle quelle,
 * aucun en-tête SilkyPlace.
 */
export function FacturePartageePage() {
  const { shareId } = useParams<{ shareId: string }>()
  const { snapshot, isLoading, error } = useFacturePartagee(shareId)

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement de la facture…</p>}
        {!isLoading && error && <p className="text-sm text-risk">{error}</p>}
        {!isLoading && snapshot && (
          <InvoiceDocumentPreview
            businessConfig={snapshot.businessConfig}
            wedding={snapshot.wedding}
            invoiceNumber={snapshot.invoiceNumber}
            date={snapshot.date}
            clientName={snapshot.clientName}
            clientAddress={snapshot.clientAddress}
            clientPhone={snapshot.clientPhone}
            lineItems={snapshot.lineItems}
            subtotal={snapshot.subtotal}
            taxAmount={snapshot.taxAmount}
            total={snapshot.total}
            vatMode={snapshot.vatMode}
            vatRate={snapshot.vatRate}
            depositAmount={snapshot.depositAmount}
            balanceAmount={snapshot.balanceAmount}
            legalMentions={snapshot.legalMentions}
            clientFacing
          />
        )}
      </main>
    </div>
  )
}
