import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InitialsBadge } from '@/components/InitialsBadge'
import { useAuth } from '@/hooks/useAuth'

/**
 * En-tête pour les pages publiques (landing, légal) quand un utilisateur
 * authentifié les visite quand même — CTA direct vers l'app + menu compte,
 * plutôt que de le laisser chercher comment y retourner. Ne rend rien si
 * personne n'est authentifié (cf. useAuth — mock à `true` tant que
 * Supabase Auth n'est pas branché, donc visible dès aujourd'hui).
 */
export function AuthenticatedHeader() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) return null

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Relia">
          <img src="/brand/relia-monogram.svg" alt="" className="size-7" />
          <span className="font-heading text-lg font-semibold text-primary">Relia</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/aujourdhui')}>Aller à mon application</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md p-1 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                aria-label="Menu du compte"
              >
                <InitialsBadge name={user?.email ?? '?'} />
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.email && <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>}
              <DropdownMenuItem onSelect={() => navigate('/parametres')}>
                <Settings className="size-4" aria-hidden="true" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <User className="size-4" aria-hidden="true" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
