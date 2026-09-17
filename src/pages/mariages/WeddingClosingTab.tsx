import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildClosingReport, computeClosingSummary } from '@/features/closing/closingSummary'
import { ClosingFeedbackForm } from '@/features/closing/components/ClosingFeedbackForm'
import { ClosingPortfolio } from '@/features/closing/components/ClosingPortfolio'
import { ClosingSummaryStats } from '@/features/closing/components/ClosingSummaryStats'
import { downloadJson } from '@/lib/downloadFile'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

export function WeddingClosingTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const allItems = useWorkspaceStore((s) => s.workspace.equipmentItems)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const allVendorLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const allExpenses = useWorkspaceStore((s) => s.workspace.expenses)
  const allScopeChanges = useWorkspaceStore((s) => s.workspace.scopeChanges)
  const allClosingSessions = useWorkspaceStore((s) => s.workspace.closingSessions)
  const closeWedding = useWorkspaceStore((s) => s.closeWedding)
  const reopenWedding = useWorkspaceStore((s) => s.reopenWedding)

  const tasks = allTasks.filter((t) => t.weddingId === wedding.id)
  const items = allItems.filter((e) => e.weddingId === wedding.id)
  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))
  const vendorLinks = allVendorLinks.filter((l) => l.weddingId === wedding.id)
  const expenses = allExpenses.filter((e) => e.weddingId === wedding.id)
  const scopeChanges = allScopeChanges.filter((sc) => sc.weddingId === wedding.id)
  const closing = allClosingSessions.find((c) => c.id === wedding.closingSessionId)

  const handleClose = () => {
    closeWedding(wedding.id)
    toast.success('Mariage clôturé — le bilan est disponible ci-dessous.')
  }

  const handleReopen = () => {
    reopenWedding(wedding.id)
    toast.success('Mariage rouvert — vous pouvez à nouveau le modifier.')
  }

  const handleExport = () => {
    if (!closing) return
    const vendorById = new Map(vendors.map((v) => [v.id, v]))
    const report = buildClosingReport(wedding, closing, tasks, items, vendorById)
    downloadJson(`bilan-${wedding.coupleName.replace(/\s+/g, '-').toLowerCase()}.json`, report)
  }

  if (!closing) {
    const preview = computeClosingSummary(wedding, tasks, items, vendors, vendorLinks, expenses, scopeChanges)
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Clôture &amp; bilan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Récapitulatif final du mariage — tâches, matériel et finances.
          </p>
        </div>

        <ClosingSummaryStats summary={preview} />

        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card px-4 py-4">
          <p className="text-sm text-muted-foreground">
            La clôture fige ce bilan et verrouille le mariage. Vous pourrez le rouvrir à tout moment pour le modifier.
          </p>
          <Button onClick={handleClose}>Clôturer le mariage</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Clôture &amp; bilan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clôturé le {format(new Date(closing.closingDate), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            Exporter le rapport
          </Button>
          <Button variant="outline" onClick={handleReopen}>
            Rouvrir le mariage
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resume">
        <TabsList>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="feedback">Feedback client</TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="pt-4">
          <ClosingSummaryStats summary={closing.summary} />
        </TabsContent>

        <TabsContent value="portfolio" className="pt-4">
          <ClosingPortfolio weddingId={wedding.id} closing={closing} />
        </TabsContent>

        <TabsContent value="feedback" className="pt-4">
          <ClosingFeedbackForm weddingId={wedding.id} closing={closing} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
