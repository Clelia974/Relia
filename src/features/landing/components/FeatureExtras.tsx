import { FileText, Moon, Search, Sheet } from 'lucide-react'

/**
 * "Et aussi" — Matériel/Prestataires/Bilan sont maintenant dans le
 * carrousel (FeatureCarousel), donc ce composant ne garde que les
 * fonctionnalités annexes de LandingPage.tsx. L'import Excel a sa propre
 * vignette dans le carrousel (première étape) — pas de doublon ici.
 */
const EXTRAS = [
  { icon: Search, label: 'Recherche instantanée', badge: 'Ctrl + K', text: 'Retrouve rapidement une information sans parcourir tous tes écrans.' },
  { icon: FileText, label: 'Suivi du contrat', text: 'Garde une vision claire de l’avancement administratif.' },
  { icon: Moon, label: 'Mode sombre', text: 'Parce que parfois, tu travailles encore le soir.' },
  { icon: Sheet, label: 'Export', text: 'Tes données restent exportables.' },
]

export function FeatureExtras() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5F6B4C]">Et aussi</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXTRAS.map(({ icon: Icon, label, badge, text }) => (
          <li key={label} className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="mt-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              {label}
              {badge && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono font-normal text-muted-foreground">{badge}</span>}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
