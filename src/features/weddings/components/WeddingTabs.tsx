import { ChevronDown } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface WeddingTabsProps {
  weddingId: string
}

interface TabItem {
  to: string
  label: string
}

interface TabGroup {
  label: string
  items: TabItem[]
}

const overviewTab: TabItem = { to: '', label: "Vue d'ensemble" }

/**
 * 11 sous-pages à plat était trop pour une seule rangée d'onglets — regroupées
 * ici par intention (organiser / suivre l'argent / exécuter le jour J) pour
 * que la nav desktop tienne sur 4 repères au lieu de 11.
 */
const groups: TabGroup[] = [
  {
    label: 'Organisation',
    items: [
      { to: 'planning', label: 'Planning' },
      { to: 'taches', label: 'Tâches' },
      { to: 'prestataires', label: 'Prestataires' },
      { to: 'documents', label: 'Documents' },
    ],
  },
  {
    label: 'Argent',
    items: [
      { to: 'finances', label: 'Finances' },
      { to: 'prestations', label: 'Prestations vendues' },
    ],
  },
  {
    label: 'Exécution',
    items: [
      { to: 'materiel', label: 'Matériel' },
      { to: 'jour-j', label: 'Jour J' },
      { to: 'demontage', label: 'Désinstallation' },
      { to: 'cloture', label: 'Clôture' },
    ],
  },
]

const allTabs: TabItem[] = [overviewTab, ...groups.flatMap((g) => g.items)]

function matchesTab(suffix: string, tab: TabItem) {
  return tab.to === '' ? suffix === '' : suffix === tab.to || suffix.startsWith(`${tab.to}/`)
}

const pillBase = 'inline-flex h-[calc(100%-3px)] items-center justify-center gap-1 rounded-md px-3 text-sm font-medium transition-colors'
const pillActive = 'bg-background text-foreground shadow-sm'
const pillInactive = 'text-foreground/60 hover:text-foreground'

export function WeddingTabs({ weddingId }: WeddingTabsProps) {
  const location = useLocation()
  const base = `/mariages/${weddingId}`
  const suffix = location.pathname.startsWith(base) ? location.pathname.slice(base.length).replace(/^\//, '') : ''
  const activeTab = allTabs.find((t) => matchesTab(suffix, t)) ?? overviewTab

  return (
    <>
      {/* Onglets — tablette et desktop : même habillage "pilule segmentée" que le Tabs partagé (cf. components/ui/tabs.tsx). */}
      <nav
        className="hidden h-9 w-fit items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-[3px] text-muted-foreground md:flex"
        aria-label="Navigation du mariage"
      >
        <NavLink
          to={base}
          end
          className={({ isActive }) => cn(pillBase, isActive ? pillActive : pillInactive)}
        >
          {overviewTab.label}
        </NavLink>

        {groups.map((group) => {
          const isGroupActive = group.items.some((item) => matchesTab(suffix, item))
          return (
            <DropdownMenu key={group.label}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(pillBase, isGroupActive ? pillActive : pillInactive, 'data-[state=open]:bg-background data-[state=open]:text-foreground')}
                >
                  {group.label}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <NavLink
                      to={`${base}/${item.to}`}
                      className={({ isActive }) => cn(isActive && 'bg-accent text-accent-foreground')}
                    >
                      {item.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}
      </nav>

      {/* Sélecteur d'onglet — mobile */}
      <div className="border-b border-border pb-3 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 data-[state=open]:border-ring"
            >
              {activeTab.label}
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuItem asChild>
              <NavLink
                to={base}
                end
                className={({ isActive }) => cn(isActive && 'bg-accent text-accent-foreground')}
              >
                {overviewTab.label}
              </NavLink>
            </DropdownMenuItem>
            {groups.map((group) => (
              <div key={group.label}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <NavLink
                      to={`${base}/${item.to}`}
                      className={({ isActive }) => cn(isActive && 'bg-accent text-accent-foreground')}
                    >
                      {item.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
