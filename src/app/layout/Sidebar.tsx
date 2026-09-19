import { CalendarDays, FileText, Heart, ListChecks, Settings, Sun, Users, Wallet } from 'lucide-react'
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
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  )

export function Sidebar() {
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center justify-between px-5 py-5">
        <NavLink to="/aujourdhui" className="flex items-center gap-2" aria-label="Relia — Aujourd'hui">
          <span className="font-heading text-lg font-semibold text-foreground">Relia</span>
          <span className="h-1.5 w-1.5 rounded-full bg-thread" aria-hidden="true" />
        </NavLink>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4" aria-label="Navigation principale">
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
