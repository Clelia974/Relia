import { Menu, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(isActive && 'bg-accent text-accent-foreground')

/** En-tête léger — logo + menu, affiché uniquement en dessous de `lg` (la navigation principale vit dans la Sidebar). */
export function TopNav({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="material-chrome no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/aujourdhui" className="flex items-center gap-2" aria-label="Relia — Aujourd'hui">
          <span className="font-heading text-lg font-semibold text-foreground">Relia</span>
          <span className="h-1.5 w-1.5 rounded-full bg-thread" aria-hidden="true" />
        </NavLink>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Rechercher"
            className="relative flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Ouvrir le menu de navigation"
                className="relative flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {mainNav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink to={item.to} end={item.end} className={mobileNavLinkClass}>
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {plusNav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink to={item.to} className={mobileNavLinkClass}>
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
