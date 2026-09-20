import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { currency } from '@/lib/currency'
import { VAT_STATUS_LABELS, vatApplies } from '@/lib/vatStatus'
import type { BusinessConfig, ProposalLineItem, VatStatus, Wedding } from '@/types/entities'

interface InvoiceDocumentPreviewProps {
  businessConfig: BusinessConfig
  wedding: Wedding
  invoiceNumber: string
  date: string
  clientName: string
  clientAddress?: string
  clientPhone?: string
  lineItems: ProposalLineItem[]
  subtotal: number
  taxAmount: number
  total: number
  vatMode: VatStatus
  vatRate?: number
  depositAmount?: number
  balanceAmount?: number
  legalMentions?: string
}

export function InvoiceDocumentPreview({
  businessConfig,
  wedding,
  invoiceNumber,
  date,
  clientName,
  clientAddress,
  clientPhone,
  lineItems,
  subtotal,
  taxAmount,
  total,
  vatMode,
  vatRate,
  depositAmount,
  balanceAmount,
  legalMentions,
}: InvoiceDocumentPreviewProps) {
  const showVat = vatApplies(vatMode)
  const accentStyle = businessConfig.brandColor ? { color: businessConfig.brandColor } : undefined

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-lg border border-border bg-card p-8 text-foreground">
      <p className="w-fit rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning">Prévisualisation indicative</p>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-start gap-3">
          {businessConfig.logoDataUrl && (
            <img
              src={businessConfig.logoDataUrl}
              alt={`Logo ${businessConfig.companyName || 'entreprise'}`}
              className="size-12 shrink-0 rounded-md object-contain"
            />
          )}
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">{businessConfig.companyName || 'Relia'}</p>
            {businessConfig.address && <p className="text-xs text-muted-foreground">{businessConfig.address}</p>}
            {businessConfig.siret && <p className="text-xs text-muted-foreground">SIRET : {businessConfig.siret}</p>}
            {businessConfig.phone && <p className="text-xs text-muted-foreground">{businessConfig.phone}</p>}
            {businessConfig.email && <p className="text-xs text-muted-foreground">{businessConfig.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs uppercase tracking-wide ${businessConfig.brandColor ? '' : 'text-thread-text'}`} style={accentStyle}>
            Facture n° {invoiceNumber}
          </p>
          <p className="text-sm text-muted-foreground">{format(new Date(date), 'd MMMM yyyy', { locale: fr })}</p>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Client</p>
          <p className="text-sm font-medium text-foreground">{clientName || wedding.coupleName}</p>
          {clientAddress && <p className="whitespace-pre-line text-sm text-muted-foreground">{clientAddress}</p>}
          {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mariage</p>
          <p className="text-sm font-medium text-foreground">{wedding.coupleName}</p>
          <p className="text-sm text-muted-foreground">{format(new Date(wedding.date), 'd MMMM yyyy', { locale: fr })}</p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">Lignes</h3>
        {lineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune ligne.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {lineItems.map((line) => (
              <div key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground">{line.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.category} · {line.quantity} × {currency.format(line.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums text-foreground">{currency.format(line.quantity * line.unitPrice)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        {showVat ? (
          <>
            <Row label="Sous-total HT" value={currency.format(subtotal)} />
            <Row label={`TVA${vatRate !== undefined ? ` (${vatRate}%)` : ''}`} value={currency.format(taxAmount)} />
            <Row label="Total TTC" value={currency.format(total)} strong />
          </>
        ) : (
          <Row label="Total configuré" value={currency.format(total)} strong />
        )}
        {depositAmount !== undefined && <Row label="Acompte" value={currency.format(depositAmount)} />}
        {balanceAmount !== undefined && <Row label="Solde restant" value={currency.format(balanceAmount)} />}
        <p className="pt-1 text-xs text-muted-foreground">
          {VAT_STATUS_LABELS[vatMode]} — calcul indicatif, vérifiez votre situation fiscale avant émission.
        </p>
      </section>

      {legalMentions && (
        <section>
          <h3 className="mb-1 font-heading text-sm font-semibold text-foreground">Mentions</h3>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{legalMentions}</p>
        </section>
      )}

      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          Cette facture est une prévisualisation indicative — elle ne constitue pas un document juridiquement conforme.
          Vérifiez les mentions applicables à votre situation avant émission.
        </p>
      </footer>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  )
}
