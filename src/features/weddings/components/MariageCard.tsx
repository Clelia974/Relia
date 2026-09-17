import { differenceInCalendarDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArchiveRestore, Archive as ArchiveIcon, MoreHorizontal, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getWeddingRiskLevel, WEDDING_RISK_LEVEL_LABELS } from '@/features/weddings/risk'
import { formatDaysUntil } from '@/lib/dateFormat'
import { WEDDING_STATUS_LABELS } from '@/lib/weddingStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Wedding } from '@/types/entities'

interface MariageCardProps {
  wedding: Wedding
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onDelete: (wedding: Wedding) => void
}

export function MariageCard({ wedding, onArchive, onUnarchive, onDelete }: MariageCardProps) {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const taskCount = workspace.tasks.filter((t) => t.weddingId === wedding.id).length
  const vendorCount = workspace.vendors.filter((v) => v.weddingIds.includes(wedding.id)).length
  const daysUntil = differenceInCalendarDays(new Date(wedding.date), new Date())
  const risk = getWeddingRiskLevel(wedding, workspace)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/mariages/${wedding.id}`} className="font-heading text-lg font-semibold text-foreground hover:underline">
            {wedding.coupleName}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions pour ${wedding.coupleName}`}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {wedding.archived ? (
                <DropdownMenuItem onSelect={() => onUnarchive(wedding.id)}>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  Désarchiver
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => onArchive(wedding.id)}>
                  <ArchiveIcon className="size-4" aria-hidden="true" />
                  Archiver
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(wedding)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground">
          {format(new Date(wedding.date), 'd MMMM yyyy', { locale: fr })}
          {wedding.venue && ` · ${wedding.venue}`}
        </p>

        <p className="text-sm text-foreground">
          {formatDaysUntil(daysUntil)} · {WEDDING_STATUS_LABELS[wedding.status]}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {vendorCount} prestataire{vendorCount !== 1 ? 's' : ''}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {taskCount} tâche{taskCount !== 1 ? 's' : ''}
          </span>
          {risk && risk.level !== 'faible' && (
            <Badge className="border-transparent bg-risk-bg text-risk">{WEDDING_RISK_LEVEL_LABELS[risk.level]}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
