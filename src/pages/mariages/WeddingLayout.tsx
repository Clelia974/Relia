import { Suspense } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Link, Outlet, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { WeddingTabs } from '@/features/weddings/components/WeddingTabs'
import { formatDaysUntil } from '@/lib/dateFormat'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Wedding } from '@/types/entities'

export interface WeddingOutletContext {
  wedding: Wedding
}

export function WeddingLayout() {
  const { weddingId } = useParams<{ weddingId: string }>()
  const wedding = useWorkspaceStore((s) => s.workspace.weddings.find((w) => w.id === weddingId))

  if (!wedding) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-6 py-16">
        <h1 className="font-heading text-xl font-semibold text-foreground">Mariage introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Ce mariage n'existe plus ou a été supprimé de cet espace de travail.
        </p>
        <Button asChild variant="outline">
          <Link to="/mariages">Retour aux mariages</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <p className="text-sm text-muted-foreground">
          <Link to="/mariages" className="hover:underline">
            Mariages
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{wedding.coupleName}</h1>
          <span className="text-sm font-medium tabular-nums text-thread-text">
            {formatDaysUntil(differenceInCalendarDays(new Date(wedding.date), new Date()))}
          </span>
        </div>
      </div>

      <div className="no-print">
        <WeddingTabs weddingId={wedding.id} />
      </div>

      <Suspense fallback={<p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>}>
        <Outlet context={{ wedding } satisfies WeddingOutletContext} />
      </Suspense>
    </div>
  )
}
