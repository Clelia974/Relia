import { CalendarDays, FileText, Heart, ListChecks, Search, Settings, Sun, Users, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/aujourdhui', label: "Aujourd'hui", end: true, icon: Sun },
  { to: '/mariages', label: 'Mariages', icon: Heart },
  { to: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { to: '/taches', label: 'Tâches', icon: ListChecks },
  { to: '/prestataires', label: 'Prestataires', icon: Users },
  { to: '/propositions', label: 'Propositions', icon: FileText },
  { to: '/finances', label: 'Finances', icon: Wallet },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-[color,background-color] duration-200',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
  )

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center justify-between px-6 pb-4 pt-7">
        <NavLink to="/aujourdhui" className="flex items-center gap-2" aria-label="Relia — Aujourd'hui">
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground">Relia</span>
          <span className="h-1.5 w-1.5 rounded-full bg-thread" aria-hidden="true" />
        </NavLink>
        <ThemeToggle />
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Rechercher"
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground transition-[color,background-color,border-color] duration-200 hover:border-primary/25 hover:bg-accent/60 hover:text-foreground"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left">Rechercher</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6 pt-2" aria-label="Navigation principale">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
