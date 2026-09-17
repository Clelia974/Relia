import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/aujourdhui', label: "Aujourd'hui", end: true },
  { to: '/mariages', label: 'Mariages' },
  { to: '/calendrier', label: 'Calendrier' },
  { to: '/taches', label: 'Tâches' },
]

const plusNav = [
  { to: '/prestataires', label: 'Prestataires' },
  { to: '/propositions', label: 'Propositions' },
  { to: '/finances', label: 'Finances' },
  { to: '/parametres', label: 'Paramètres' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'border-b-2 px-1 pb-3 pt-4 text-sm font-medium transition-colors',
    isActive
      ? 'border-thread text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )

export function TopNav() {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 sm:px-6">
        <NavLink to="/aujourdhui" className="flex items-center gap-2 py-4" aria-label="Relia — Aujourd'hui">
          <span className="font-heading text-lg font-semibold text-foreground">Relia</span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-thread sm:block" aria-hidden="true" />
        </NavLink>

        <nav className="flex flex-1 items-center gap-6 overflow-x-auto" aria-label="Navigation principale">
          {mainNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 border-b-2 border-transparent px-1 pb-3 pt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
                Plus
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              {plusNav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => cn(isActive && 'bg-accent text-accent-foreground')}
                  >
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
