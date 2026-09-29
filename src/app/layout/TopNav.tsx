import { LogOut, Menu, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useNewLeadsBadge } from '@/features/leads/useNewLeadsBadge'
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
]

const accountNav = [
  { to: '/parametres', label: 'Paramètres' },
  { to: '/paiement', label: 'Abonnement' },
]

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(isActive && 'bg-accent text-accent-foreground')

/** En-tête léger — logo + menu, affiché uniquement en dessous de `lg` (la navigation principale vit dans la Sidebar). */
export function TopNav({ onSearch }: { onSearch: () => void }) {
  const { logout } = useAuth()
  const newLeadsCount = useNewLeadsBadge()

  return (
    <header className="material-chrome no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/aujourdhui" className="flex items-center gap-2" aria-label="Jordu — Aujourd'hui">
          <img src="/brand/jordu-wordmark.svg" alt="Jordu — aujourd'hui" width={67} height={28} className="h-7 w-auto dark:hidden" />
          <img
            src="/brand/jordu-wordmark-reversed.svg"
            alt="Jordu — aujourd'hui"
            width={67}
            height={28}
            className="hidden h-7 w-auto dark:block"
          />
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
                {newLeadsCount > 0 && (
                  <span
                    className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary"
                    aria-label={`${newLeadsCount} nouvelle(s) demande(s)`}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {mainNav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink to={item.to} end={item.end} className={cn(mobileNavLinkClass, 'flex items-center justify-between')}>
                    {item.label}
                    {item.to === '/mariages' && newLeadsCount > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 justify-center rounded-full px-1.5">
                        {newLeadsCount}
                      </Badge>
                    )}
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
              <DropdownMenuSeparator />
              {accountNav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink to={item.to} className={mobileNavLinkClass}>
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem variant="destructive" onSelect={logout}>
                <LogOut className="size-4" aria-hidden="true" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
