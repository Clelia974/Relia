import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ProposalTotals } from '@/features/proposals/calculations'
import { currency } from '@/lib/currency'
import { VAT_STATUS_LABELS, vatApplies } from '@/lib/vatStatus'
import type { BusinessConfig, ProposalLineItem, VatStatus, Wedding } from '@/types/entities'

interface ProposalDocumentPreviewProps {
  businessConfig: BusinessConfig
  wedding: Wedding
  title: string
  templateLabel: string
  clientName: string
  validUntil?: string
  lineItems: ProposalLineItem[]
  totals: ProposalTotals
  vatMode: VatStatus
  vatRate?: number
  depositPercentage?: number
  notes?: string
}

export function ProposalDocumentPreview({
  businessConfig,
  wedding,
  title,
  templateLabel,
  clientName,
  validUntil,
  lineItems,
  totals,
  vatMode,
  vatRate,
  depositPercentage,
  notes,
}: ProposalDocumentPreviewProps) {
  const services = lineItems.filter((l) => l.included && !l.optional)
  const options = lineItems.filter((l) => l.optional)
  const showVat = vatApplies(vatMode)
  const accentStyle = businessConfig.brandColor ? { color: businessConfig.brandColor } : undefined

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-lg border border-border bg-card p-8 text-foreground">
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
            {businessConfig.email && <p className="text-xs text-muted-foreground">{businessConfig.email}</p>}
            {businessConfig.phone && <p className="text-xs text-muted-foreground">{businessConfig.phone}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs uppercase tracking-wide ${businessConfig.brandColor ? '' : 'text-thread'}`} style={accentStyle}>
            Proposition — {templateLabel}
          </p>
          <p className="font-heading text-xl font-semibold text-foreground">{title}</p>
          {validUntil && (
            <p className="mt-1 text-xs text-muted-foreground">Valable jusqu'au {format(new Date(validUntil), 'd MMMM yyyy', { locale: fr })}</p>
          )}
        </div>
      </header>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Couple</p>
          <p className="text-sm font-medium text-foreground">{clientName || wedding.coupleName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mariage</p>
          <p className="text-sm font-medium text-foreground">{format(new Date(wedding.date), 'd MMMM yyyy', { locale: fr })}</p>
          {wedding.venue && <p className="text-sm text-muted-foreground">{wedding.venue}</p>}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">Services inclus</h3>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun service inclus pour l'instant.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {services.map((line) => (
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

      {options.length > 0 && (
        <section>
          <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">Options</h3>
          <div className="flex flex-col divide-y divide-border">
            {options.map((line) => (
              <div key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground">{line.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.category} · {line.quantity} × {currency.format(line.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums text-muted-foreground">+ {currency.format(line.quantity * line.unitPrice)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        {showVat ? (
          <>
            <Row label="Sous-total HT" value={currency.format(totals.subtotal)} />
            <Row label={`TVA${vatRate !== undefined ? ` (${vatRate}%)` : ''}`} value={currency.format(totals.taxAmount)} />
            <Row label="Total TTC" value={currency.format(totals.total)} strong />
          </>
        ) : (
          <Row label="Total configuré" value={currency.format(totals.total)} strong />
        )}
        {depositPercentage !== undefined && depositPercentage > 0 && (
          <Row label={`Acompte (${depositPercentage}%)`} value={currency.format(totals.depositAmount)} />
        )}
        {depositPercentage !== undefined && depositPercentage > 0 && <Row label="Solde restant" value={currency.format(totals.balanceAmount)} />}
        <p className="pt-1 text-xs text-muted-foreground">
          {VAT_STATUS_LABELS[vatMode]} — calcul indicatif, vérifiez votre situation fiscale avant émission.
        </p>
      </section>

      {notes && (
        <section>
          <h3 className="mb-1 font-heading text-sm font-semibold text-foreground">Notes</h3>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{notes}</p>
        </section>
      )}

      <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
        <p>Document indicatif généré avec Relia — ne constitue pas un contrat.</p>
        {businessConfig.legalMentions && <p className="mt-1">{businessConfig.legalMentions}</p>}
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
