import { CheckCircle2, Clock, Wallet } from 'lucide-react'
import { TRIAL_DAYS } from '@/features/landing/landingContent'

/**
 * Visuel du hero (colonne droite) — inspiré de la mise en scène gbcrea.com
 * (mockup + badges flottants), mais avec un VRAI écran Relia déjà utilisé
 * ailleurs sur le site (public/landing/jour-j.jpg) et des libellés
 * qualitatifs honnêtes — aucun chiffre d'usage inventé.
 * V2 : plus d'air autour du mockup (halo flou en fond, badges détachés du
 * bord de la carte au lieu de la chevaucher) — la V1 donnait une
 * impression de superposition trop dense/collée.
 * Flottement en boucle désactivé automatiquement par la règle globale
 * prefers-reduced-motion (src/index.css).
 */
export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-md px-6 py-10 lg:mx-0 lg:max-w-lg">
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-float { animation: hero-float 6s ease-in-out infinite; }
        .hero-float-alt { animation: hero-float 6s ease-in-out infinite; animation-delay: 1.6s; }
      `}</style>

      {/* Halo doux en fond, pour donner de la profondeur sans coller les éléments les uns aux autres */}
      <div className="absolute inset-8 -z-10 rounded-[2.5rem] bg-sage/20 blur-3xl" aria-hidden="true" />

      {/* Mockup principal, seul — plus de second écran superposé en dessous */}
      <div
        className="animate-notice-in hero-float overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-raised)"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2.5">
          <span className="size-2.5 rounded-full bg-risk" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
          <span className="ml-2 text-xs text-muted-foreground">Jour J</span>
        </div>
        <img
          src="/landing/jour-j.jpg"
          alt="Déroulé du Jour J dans l'application Relia"
          width={1200}
          height={682}
          className="block w-full"
        />
      </div>

      {/* Badges flottants — détachés à l'extérieur du cadre, faits vrais (pas de statistiques d'usage) */}
      <span
        className="animate-notice-in hero-float absolute -right-2 top-2 z-10 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:-right-6 sm:top-4"
        style={{ animationDelay: '480ms' }}
      >
        <Clock className="size-3.5 text-thread-text" aria-hidden="true" />
        Minute par minute
      </span>

      <span
        className="animate-notice-in hero-float-alt absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:-left-8 sm:flex"
        style={{ animationDelay: '620ms' }}
      >
        <Wallet className="size-3.5 text-thread-text" aria-hidden="true" />
        Budget & rentabilité
      </span>

      <span
        className="animate-notice-in hero-float absolute -bottom-2 right-4 z-10 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:bottom-0 sm:right-10"
        style={{ animationDelay: '760ms' }}
      >
        <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
        Essai {TRIAL_DAYS} jours, sans CB
      </span>
    </div>
  )
}
