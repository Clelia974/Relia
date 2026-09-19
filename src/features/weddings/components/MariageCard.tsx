import { useMemo } from 'react'
import { differenceInCalendarDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArchiveRestore, Archive as ArchiveIcon, MoreHorizontal, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { InitialsBadge } from '@/components/InitialsBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  const riskWorkspace = useWorkspaceStore(
    useShallow((s) => ({
      tasks: s.workspace.tasks,
      vendors: s.workspace.vendors,
      clientDecisions: s.workspace.clientDecisions,
      timelineEvents: s.workspace.timelineEvents,
      ignoredConflictIds: s.workspace.ignoredConflictIds,
    })),
  )
  const taskCount = useMemo(
    () => riskWorkspace.tasks.filter((t) => t.weddingId === wedding.id).length,
    [riskWorkspace.tasks, wedding.id],
  )
  const vendorCount = useMemo(
    () => riskWorkspace.vendors.filter((v) => v.weddingIds.includes(wedding.id)).length,
    [riskWorkspace.vendors, wedding.id],
  )
  const daysUntil = differenceInCalendarDays(new Date(wedding.date), new Date())
  const risk = useMemo(() => getWeddingRiskLevel(wedding, riskWorkspace), [wedding, riskWorkspace])

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/mariages/${wedding.id}`} className="flex min-w-0 items-center gap-2.5 hover:underline">
            <InitialsBadge name={wedding.coupleName} />
            <span className="truncate font-heading text-lg font-semibold text-foreground">{wedding.coupleName}</span>
          </Link>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions pour ${wedding.coupleName}`}
                    className="relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-accent-foreground"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Actions</TooltipContent>
            </Tooltip>
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
