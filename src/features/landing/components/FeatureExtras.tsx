import { FileSpreadsheet, FileText, Moon, Search, Sheet } from 'lucide-react'

/**
 * "Et aussi" — Matériel/Prestataires/Bilan sont maintenant dans le
 * carrousel (FeatureCarousel), donc ce composant ne garde que les
 * fonctionnalités annexes de LandingPage.tsx, en chips visibles plutôt
 * qu'en texte inline discret.
 */
const EXTRAS = [
  { icon: FileSpreadsheet, label: 'Import de tes mariages depuis Excel' },
  { icon: Search, label: 'Recherche instantanée (Ctrl + K)' },
  { icon: FileText, label: 'Suivi du contrat' },
  { icon: Moon, label: 'Mode sombre' },
  { icon: Sheet, label: 'Export de tes données' },
]

export function FeatureExtras() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">Et aussi</p>
      <ul className="flex flex-wrap gap-3">
        {EXTRAS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-(--shadow-card)">
            <Icon className="size-4 text-thread-text" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
