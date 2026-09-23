import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VENDOR_STATUS_LABELS } from '@/lib/vendorStatus'
import { WEDDING_STATUS_LABELS } from '@/lib/weddingStatus'
import { parseWeddingImportFile, type WeddingImportResult } from '@/lib/workspace/weddingImport'
import { downloadWeddingImportTemplate } from '@/lib/workspace/weddingImportTemplate'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Import de mariages (+ prestataires, facultatif) depuis le modèle Excel
 * RELIA (Paramètres). Tâches et matériel restent hors périmètre : une
 * cliente n'a presque jamais déjà ces données sous forme de tableur (cf.
 * décision prise avec l'utilisatrice), et le formulaire de l'app (menus
 * déroulants) est plus rapide et plus fiable pour ça qu'une saisie Excel.
 *
 * Chaque ligne est validée indépendamment : une ligne en erreur n'empêche
 * jamais l'import des autres. Un prestataire dont le mariage référencé est
 * lui-même en erreur est signalé, jamais importé "orphelin".
 */
export function ImportWeddingsFromExcel() {
  const createWedding = useWorkspaceStore((s) => s.createWedding)
  const addVendor = useWorkspaceStore((s) => s.addVendor)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [result, setResult] = useState<WeddingImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsParsing(true)
    try {
      const parsed = await parseWeddingImportFile(file)
      if (parsed.fileError) {
        toast.error(parsed.fileError)
        return
      }
      if (parsed.weddingRows.length === 0 && parsed.vendorRows.length === 0) {
        toast.error('Aucune ligne trouvée dans ce fichier.')
        return
      }
      setResult(parsed)
    } finally {
      setIsParsing(false)
    }
  }

  const validWeddingRows = result?.weddingRows.filter((r) => r.data !== null) ?? []
  const errorWeddingRows = result?.weddingRows.filter((r) => r.data === null) ?? []
  const validVendorRows = result?.vendorRows.filter((r) => r.data !== null) ?? []
  const errorVendorRows = result?.vendorRows.filter((r) => r.data === null) ?? []
  const errorCount = errorWeddingRows.length + errorVendorRows.length

  const confirmImport = () => {
    if (validWeddingRows.length === 0) return
    setIsImporting(true)
    try {
      const weddingIdByReference = new Map<string, string>()
      for (const row of validWeddingRows) {
        if (!row.data) continue
        const id = createWedding(row.data)
        weddingIdByReference.set(row.reference, id)
      }

      let importedVendors = 0
      for (const row of validVendorRows) {
        if (!row.data) continue
        const weddingId = weddingIdByReference.get(row.weddingReference)
        // Ne devrait plus arriver (déjà filtré à l'analyse) — filet de sécurité si le mariage référencé a échoué à la création.
        if (!weddingId) continue
        addVendor({
          name: row.data.name,
          category: row.data.category,
          company: row.data.company,
          phone: row.data.phone,
          email: row.data.email,
          notes: row.data.notes,
          weddingIds: [weddingId],
          status: row.data.status,
          arrivalTime: row.data.arrivalTime,
          estimatedCost: row.data.estimatedCost,
          actualCost: row.data.actualCost,
        })
        importedVendors += 1
      }

      const parts = [`${validWeddingRows.length} mariage${validWeddingRows.length > 1 ? 's' : ''}`]
      if (importedVendors > 0) parts.push(`${importedVendors} prestataire${importedVendors > 1 ? 's' : ''}`)
      toast.success(`${parts.join(' et ')} importé${validWeddingRows.length > 1 || importedVendors > 1 ? 's' : ''}.`)
      setResult(null)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => void downloadWeddingImportTemplate()}>
        <Download className="size-4" aria-hidden="true" />
        Télécharger le modèle
      </Button>

      <Button variant="outline" loading={isParsing} onClick={() => fileInputRef.current?.click()}>
        {!isParsing && <Upload className="size-4" aria-hidden="true" />}
        Importer des mariages (Excel)
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChosen}
      />

      <Dialog open={result !== null} onOpenChange={(open) => !open && setResult(null)}>
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de l'import</DialogTitle>
            <DialogDescription>
              {validWeddingRows.length} mariage{validWeddingRows.length !== 1 ? 's' : ''}
              {validVendorRows.length > 0 && ` et ${validVendorRows.length} prestataire${validVendorRows.length !== 1 ? 's' : ''}`}
              {' '}prêt{validWeddingRows.length !== 1 ? 's' : ''} à importer
              {errorCount > 0 && `, ${errorCount} ligne${errorCount > 1 ? 's' : ''} à corriger`}. Rien n'est encore
              enregistré.
            </DialogDescription>
          </DialogHeader>

          {result && result.weddingRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">Mariages</p>
              {result.weddingRows.map((row) => (
                <div key={`w-${row.rowNumber}`} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
                  {row.data ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.reference || `Ligne ${row.rowNumber}`}
                    </p>
                    {row.data ? (
                      <p className="text-foreground">
                        {row.data.coupleName} — {row.data.venue} · {WEDDING_STATUS_LABELS[row.data.status]}
                      </p>
                    ) : (
                      <ul className="text-risk">
                        {row.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result && result.vendorRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">Prestataires</p>
              {result.vendorRows.map((row) => (
                <div key={`v-${row.rowNumber}`} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
                  {row.data ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-risk" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.weddingReference || `Ligne ${row.rowNumber}`}
                    </p>
                    {row.data ? (
                      <p className="text-foreground">
                        {row.data.name} — {row.data.category} · {VENDOR_STATUS_LABELS[row.data.status]}
                      </p>
                    ) : (
                      <ul className="text-risk">
                        {row.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResult(null)}>
              Annuler
            </Button>
            <Button onClick={confirmImport} loading={isImporting} disabled={validWeddingRows.length === 0}>
              Importer {validWeddingRows.length} mariage{validWeddingRows.length !== 1 ? 's' : ''}
              {validVendorRows.length > 0 && ` et ${validVendorRows.length} prestataire${validVendorRows.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
