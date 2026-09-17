import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface WeddingTabsProps {
  weddingId: string
}

const tabs = [
  { to: '', label: "Vue d'ensemble" },
  { to: 'planning', label: 'Planning' },
  { to: 'taches', label: 'Tâches' },
  { to: 'prestataires', label: 'Prestataires' },
  { to: 'finances', label: 'Finances' },
  { to: 'documents', label: 'Documents' },
  { to: 'prestations', label: 'Prestations vendues' },
  { to: 'materiel', label: 'Matériel' },
  { to: 'jour-j', label: 'Jour J' },
  { to: 'demontage', label: 'Désinstallation' },
]

export function WeddingTabs({ weddingId }: WeddingTabsProps) {
  return (
    <nav
      className="flex gap-5 overflow-x-auto border-b border-border"
      aria-label="Navigation du mariage"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={`/mariages/${weddingId}${tab.to ? `/${tab.to}` : ''}`}
          end={tab.to === ''}
          className={({ isActive }) =>
            cn(
              'whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors',
              isActive ? 'border-thread text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
