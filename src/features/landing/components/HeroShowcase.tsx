import { CheckCircle2, Clock, Wallet } from 'lucide-react'
import { TRIAL_DAYS } from '@/features/landing/landingContent'

/**
 * Visuel du hero (colonne droite) — vrais mockups photo (MacBook Pro 16",
 * iPhone 16) depuis webmobilefirst.com (licence : usage commercial libre,
 * sans attribution — public/mockups/*.png), avec les VRAIS écrans Relia
 * déjà utilisés ailleurs sur le site composités dedans à la génération
 * (script Python, pas de rendu à la volée) — aucun chiffre d'usage inventé,
 * aucune UI mobile dédiée qui n'existe pas : c'est la même interface
 * responsive, seulement cadrée différemment.
 * Flottement en boucle désactivé automatiquement par la règle globale
 * prefers-reduced-motion (src/index.css).
 */
export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-lg px-6 py-10 lg:mr-0 lg:ml-auto lg:max-w-3xl lg:px-2">
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

      <img
        src="/mockups/hero-macbook.png"
        alt="Déroulé du Jour J dans l'application Relia, sur MacBook"
        width={800}
        height={489}
        className="animate-notice-in hero-float block w-full drop-shadow-[0_18px_32px_rgba(31,45,61,0.25)]"
        style={{ animationDelay: '140ms' }}
      />

      <img
        src="/mockups/hero-iphone.png"
        alt="Tableau de bord du jour dans l'application Relia, sur iPhone"
        width={393}
        height={800}
        className="animate-notice-in hero-float-alt absolute -right-4 bottom-[-3.5rem] z-10 w-[22%] drop-shadow-[0_14px_24px_rgba(31,45,61,0.28)] sm:-right-8 sm:w-[24%]"
        style={{ animationDelay: '320ms' }}
      />

      {/* Badges flottants — détachés à l'extérieur du cadre, faits vrais (pas de statistiques d'usage) */}
      <span
        className="animate-notice-in hero-float absolute -right-2 top-[32%] z-20 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:-right-6"
        style={{ animationDelay: '480ms' }}
      >
        <Clock className="size-3.5 text-thread-text" aria-hidden="true" />
        Minute par minute
      </span>

      <span
        className="animate-notice-in hero-float-alt absolute -left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:-left-8 sm:flex"
        style={{ animationDelay: '620ms' }}
      >
        <Wallet className="size-3.5 text-thread-text" aria-hidden="true" />
        Budget & rentabilité
      </span>

      <span
        className="animate-notice-in hero-float absolute -bottom-2 left-4 z-20 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-(--shadow-raised) sm:bottom-0 sm:left-2"
        style={{ animationDelay: '760ms' }}
      >
        <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
        Essai {TRIAL_DAYS} jours, sans CB
      </span>
    </div>
  )
}
