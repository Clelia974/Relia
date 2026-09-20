import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarHeart, CornerDownLeft, FileText, ListChecks, ReceiptText, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { SEARCH_KIND_LABELS, searchWorkspace, type SearchResult, type SearchResultKind } from '@/features/search/searchWorkspace'
import { useReturnFocus } from '@/lib/useReturnFocus'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const KIND_ICON: Record<SearchResultKind, typeof Search> = {
  mariage: CalendarHeart,
  prestataire: Users,
  devis: FileText,
  facture: ReceiptText,
  tache: ListChecks,
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Recherche globale (Ctrl/⌘ + K) : mariages, prestataires, devis, factures et tâches, au clavier. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const returnFocus = useReturnFocus()
  // Chaque ouverture repart d'une recherche vierge, même si on rouvre pendant l'animation de fermeture.
  const [session, setSession] = useState(0)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setSession((n) => n + 1)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[16%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        onOpenAutoFocus={returnFocus.onOpenAutoFocus}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      >
        <DialogTitle className="sr-only">Recherche</DialogTitle>
        <DialogDescription className="sr-only">
          Tapez pour chercher un mariage, un prestataire, un devis, une facture ou une tâche. Flèches pour choisir, Entrée pour ouvrir.
        </DialogDescription>
        <PaletteBody key={session} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PaletteBody({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const workspace = useWorkspaceStore(
    useShallow((s) => ({
      weddings: s.workspace.weddings,
      vendors: s.workspace.vendors,
      proposals: s.workspace.proposals,
      invoices: s.workspace.invoices,
      tasks: s.workspace.tasks,
    })),
  )
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchWorkspace(workspace, query), [workspace, query])
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0))

  useEffect(() => {
    listRef.current?.querySelector(`#search-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, results])

  const open = (result: SearchResult | undefined) => {
    if (!result) return
    navigate(result.href)
    onDone()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((activeIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((activeIndex - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      open(results[activeIndex])
    }
  }

  const hasQuery = query.trim().length > 0

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-listbox"
          aria-activedescendant={results.length > 0 ? `search-option-${activeIndex}` : undefined}
          aria-label="Rechercher"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un mariage, un prestataire, un devis…"
          className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div ref={listRef} className="max-h-[min(24rem,60dvh)] overflow-y-auto p-2" id="search-listbox" role="listbox" aria-label="Résultats">
        {!hasQuery && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tapez pour chercher dans tout votre espace.</p>}
        {hasQuery && results.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {query.trim()} ».</p>
        )}
        {results.map((result, index) => {
          const Icon = KIND_ICON[result.kind]
          const startsGroup = index === 0 || results[index - 1].kind !== result.kind
          return (
            <div key={`${result.kind}-${result.id}`} role="presentation">
              {startsGroup && (
                <p role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-1">
                  {SEARCH_KIND_LABELS[result.kind]}
                </p>
              )}
              <div
                id={`search-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseMove={() => setActive(index)}
                onClick={() => open(result)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-100',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{result.title}</span>
                  {result.subtitle && <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>}
                </span>
                {index === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
