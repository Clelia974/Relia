import { useState } from 'react'
import { Copy, FileJson, Lock, Printer, Trash2 } from 'lucide-react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { computeProposalTotals } from '@/features/proposals/calculations'
import { LineItemsEditor } from '@/features/proposals/components/LineItemsEditor'
import { emptyLineItemFormValues, ProposalLineItemFormSchema, type ProposalLineItemFormValues } from '@/features/proposals/proposalForm.schema'
import { InvoiceDocumentPreview } from '@/features/invoices/components/InvoiceDocumentPreview'
import { InvoiceStatusBadge } from '@/features/invoices/components/InvoiceStatusBadge'
import { InvoicePreviewFormSchema } from '@/features/invoices/invoicePreviewForm.schema'
import { copyTextToClipboard } from '@/lib/clipboard'
import { currency } from '@/lib/currency'
import { downloadJson } from '@/lib/downloadFile'
import { isInvoiceEditable } from '@/lib/invoiceStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

function toNumericLines(lines: ProposalLineItemFormValues[]) {
  return lines.map((l) => ({
    id: l.id,
    description: l.description.trim(),
    category: l.category.trim(),
    quantity: Number(l.quantity) || 0,
    unitPrice: Number(l.unitPrice) || 0,
    total: (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    included: l.included,
    optional: l.optional,
    notes: l.notes.trim() || undefined,
  }))
}

export function InvoicePreviewPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  return <InvoicePreviewInner key={invoiceId} invoiceId={invoiceId ?? ''} />
}

function InvoicePreviewInner({ invoiceId }: { invoiceId: string }) {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const navigate = useNavigate()
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const invoice = useWorkspaceStore((s) => s.workspace.invoices.find((inv) => inv.id === invoiceId))
  const updateInvoicePreview = useWorkspaceStore((s) => s.updateInvoicePreview)
  const updateInvoiceStatus = useWorkspaceStore((s) => s.updateInvoiceStatus)
  const duplicateInvoicePreview = useWorkspaceStore((s) => s.duplicateInvoicePreview)
  const deleteInvoicePreview = useWorkspaceStore((s) => s.deleteInvoicePreview)

  /** Attribué automatiquement à la création : jamais modifiable. */
  const invoiceNumber = invoice?.invoiceNumber ?? ''
  const [date, setDate] = useState(invoice?.date.slice(0, 10) ?? '')
  const [clientName, setClientName] = useState(invoice?.clientName ?? '')
  const [clientAddress, setClientAddress] = useState(invoice?.clientAddress ?? wedding.clientAddress ?? '')
  const [clientPhone, setClientPhone] = useState(invoice?.clientPhone ?? wedding.clientPhone ?? '')
  const [legalMentions, setLegalMentions] = useState(invoice?.legalMentions ?? '')
  const [lines, setLines] = useState<ProposalLineItemFormValues[]>(
    () =>
      invoice?.lineItems.map((l) =>
        emptyLineItemFormValues({
          id: l.id,
          description: l.description,
          category: l.category,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          included: l.included,
          optional: l.optional,
          notes: l.notes ?? '',
        }),
      ) ?? [],
  )
  const [errors, setErrors] = useState<Partial<Record<'date', string>>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, Partial<Record<keyof ProposalLineItemFormValues, string>>>>({})
  const [view, setView] = useState<'editeur' | 'apercu'>(invoice && !isInvoiceEditable(invoice.status) ? 'apercu' : 'editeur')
  const [pendingDelete, setPendingDelete] = useState(false)
  const [pendingFinalize, setPendingFinalize] = useState(false)

  if (!invoice) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-6 py-16">
        <h1 className="font-heading text-xl font-semibold text-foreground">Facture introuvable</h1>
        <Button asChild variant="outline">
          <Link to={`/mariages/${wedding.id}/documents`}>Retour aux documents</Link>
        </Button>
      </div>
    )
  }

  /** Finalisée : lecture seule pour toujours (Phase 2b) — seule une nouvelle version (dupliquer) peut la corriger. */
  const editable = isInvoiceEditable(invoice.status)

  const numericLines = toNumericLines(lines)
  const totals = computeProposalTotals(numericLines, invoice.vatMode, invoice.vatRate, undefined)

  const setLineField = (id: string, patch: Partial<ProposalLineItemFormValues>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id))
  const addLine = () => setLines((prev) => [...prev, emptyLineItemFormValues()])

  const handleSave = () => {
    const result = InvoicePreviewFormSchema.safeParse({ date, clientName, legalMentions })
    const fieldErrors: typeof errors = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof errors
        if (key === 'date') fieldErrors[key] = issue.message
      }
    }

    const newRowErrors: typeof rowErrors = {}
    for (const line of lines) {
      const lineResult = ProposalLineItemFormSchema.safeParse(line)
      if (!lineResult.success) {
        const lineErrs: Partial<Record<keyof ProposalLineItemFormValues, string>> = {}
        for (const issue of lineResult.error.issues) {
          const key = issue.path[0] as keyof ProposalLineItemFormValues
          if (!lineErrs[key]) lineErrs[key] = issue.message
        }
        newRowErrors[line.id] = lineErrs
      }
    }

    setErrors(fieldErrors)
    setRowErrors(newRowErrors)
    if (!result.success || Object.keys(newRowErrors).length > 0) {
      toast.error('Veuillez corriger les champs en erreur.')
      return
    }

    const finalLines = toNumericLines(lines)
    const finalTotals = computeProposalTotals(finalLines, invoice.vatMode, invoice.vatRate, undefined)
    updateInvoicePreview(invoice.id, {
      date: new Date(date).toISOString(),
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      legalMentions: legalMentions.trim() || undefined,
      lineItems: finalLines,
      subtotal: finalTotals.subtotal,
      taxAmount: finalTotals.taxAmount,
      total: finalTotals.total,
    })
    toast.success('Facture indicative enregistrée.')
  }

  const handleCopy = async () => {
    const text = [
      `Facture n° ${invoiceNumber} — ${clientName || wedding.coupleName}`,
      ...numericLines.map((l) => `- ${l.description} : ${currency.format(l.total)}`),
      '',
      `Sous-total : ${currency.format(totals.subtotal)}`,
      `Total : ${currency.format(totals.total)}`,
    ].join('\n')
    const ok = await copyTextToClipboard(text)
    toast[ok ? 'success' : 'error'](ok ? 'Contenu copié dans le presse-papiers.' : 'Impossible de copier automatiquement.')
  }

  const handleExportJson = () => {
    downloadJson(`facture-${invoice.id}.json`, { ...invoice, invoiceNumber, clientName, legalMentions, lineItems: numericLines, ...totals })
    toast.success('Facture exportée en JSON.')
  }

  const handleDuplicate = () => {
    const newId = duplicateInvoicePreview(invoice.id)
    if (newId) {
      toast.success('Facture dupliquée.')
      navigate(`/mariages/${wedding.id}/documents/factures/${newId}`)
    }
  }

  const confirmFinalize = () => {
    updateInvoiceStatus(invoice.id, 'finalisee')
    toast.success('Facture finalisée — elle est maintenant en lecture seule.')
    setPendingFinalize(false)
  }

  const confirmDelete = () => {
    deleteInvoicePreview(invoice.id)
    toast.success('Facture supprimée.')
    navigate(`/mariages/${wedding.id}/documents`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/mariages/${wedding.id}/documents`} className="text-sm text-muted-foreground hover:underline">
            ← Documents
          </Link>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Facture n° {invoiceNumber || invoice.invoiceNumber}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
            <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">Prévisualisation indicative</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && (
            <Button variant="outline" onClick={() => setPendingFinalize(true)}>
              <Lock className="size-4" aria-hidden="true" />
              Finaliser
            </Button>
          )}
          <Button variant="outline" onClick={handleDuplicate}>
            {editable ? 'Dupliquer' : 'Créer une nouvelle version'}
          </Button>
          <Button variant="outline" className="text-risk hover:text-risk" onClick={() => setPendingDelete(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer
          </Button>
        </div>
      </div>

      {!editable && (
        <Alert className="no-print border-warning/40 bg-warning-bg">
          <Lock className="size-4 text-warning" aria-hidden="true" />
          <AlertDescription className="text-warning">
            Cette facture est finalisée et verrouillée — son statut et son contenu ne peuvent plus être modifiés. Pour la corriger, créez une
            nouvelle version.
          </AlertDescription>
        </Alert>
      )}

      <div className="no-print flex flex-wrap gap-2">
        {editable && (
          <>
            <Button variant={view === 'editeur' ? 'default' : 'outline'} size="sm" onClick={() => setView('editeur')}>
              Éditeur
            </Button>
            <Button variant={view === 'apercu' ? 'default' : 'outline'} size="sm" onClick={() => setView('apercu')}>
              Aperçu
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="size-4" aria-hidden="true" />
          Copier
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}>
          <FileJson className="size-4" aria-hidden="true" />
          Exporter en JSON
        </Button>
        {!editable || view === 'apercu' ? (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimer / Enregistrer en PDF
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setView('apercu')}>
            <Printer className="size-4" aria-hidden="true" />
            Prévisualiser avant impression
          </Button>
        )}
      </div>

      {editable && view === 'editeur' ? (
        <div className="no-print flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Field label="Numéro de facture" htmlFor="inv-number">
                  <Input id="inv-number" value={invoiceNumber} readOnly aria-describedby="inv-number-hint" className="bg-muted/40 tabular-nums" />
                  <p id="inv-number-hint" className="text-xs text-muted-foreground">
                    Attribué automatiquement, non modifiable.
                  </p>
                </Field>
                <Field label="Date" htmlFor="inv-date" error={errors.date}>
                  <Input
                    id="inv-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={errors.date ? 'inv-date-error' : undefined}
                  />
                </Field>
                <Field label="Client" htmlFor="inv-client" optional>
                  <Input id="inv-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={wedding.coupleName} />
                </Field>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <Field label="Adresse du client" htmlFor="inv-client-address" optional>
                  <Textarea id="inv-client-address" rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Numéro, rue, code postal, ville" />
                </Field>
                <Field label="Téléphone du client" htmlFor="inv-client-phone" optional>
                  <Input id="inv-client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Ex. 06 12 34 56 78" />
                </Field>
              </div>
              {(!clientAddress.trim() || !clientPhone.trim()) && (
                <p className="text-xs text-warning">Pour un document conforme, renseignez l'adresse et le téléphone du client.</p>
              )}
              <Field label="Mentions" htmlFor="inv-mentions" optional>
                <Textarea id="inv-mentions" rows={2} value={legalMentions} onChange={(e) => setLegalMentions(e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Lignes</h2>
            <Button variant="outline" size="sm" onClick={addLine}>
              Ajouter une ligne
            </Button>
          </div>
          <LineItemsEditor lines={lines} errors={rowErrors} onChange={setLineField} onRemove={removeLine} />

          <Card>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Sous-total" value={currency.format(totals.subtotal)} />
              <Row label="TVA indicative" value={currency.format(totals.taxAmount)} />
              <Row label="Total" value={currency.format(totals.total)} strong />
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-fit">
            Enregistrer
          </Button>
        </div>
      ) : (
        <div className="print-area">
          <InvoiceDocumentPreview
            businessConfig={businessConfig}
            wedding={wedding}
            invoiceNumber={invoiceNumber}
            date={date ? new Date(date).toISOString() : invoice.date}
            clientName={clientName || wedding.coupleName}
            clientAddress={clientAddress.trim() || undefined}
            clientPhone={clientPhone.trim() || undefined}
            lineItems={numericLines}
            subtotal={totals.subtotal}
            taxAmount={totals.taxAmount}
            total={totals.total}
            vatMode={invoice.vatMode}
            vatRate={invoice.vatRate}
            depositAmount={invoice.depositAmount}
            balanceAmount={invoice.balanceAmount}
            legalMentions={legalMentions || businessConfig.legalMentions}
          />
        </div>
      )}

      <AlertDialog open={pendingFinalize} onOpenChange={setPendingFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finaliser cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une fois finalisée, cette facture devient définitivement en lecture seule : plus aucune modification de contenu ni retour en
              arrière ne sera possible. Pour corriger quelque chose ensuite, vous devrez créer une nouvelle version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinalize}>Finaliser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture indicative ?</AlertDialogTitle>
            <AlertDialogDescription>Cette facture sera définitivement supprimée. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-risk">
          {error}
        </p>
      )}
    </div>
  )
}
