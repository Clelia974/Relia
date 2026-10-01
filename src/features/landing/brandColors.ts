/**
 * Couleurs de marque SilkyPlace pour les pages publiques (LandingPage + SilkyPlaceLandingPage).
 *
 * Pourquoi pas les tokens --primary / --thread : ces variables globales (src/index.css)
 * sont encore celles de l'ancien design system "Relia — Calme & Luxe" (#6B1F23, #75561A)
 * et pilotent toute l'app connectée (sidebar, boutons, etc.) — les changer ici changerait
 * toute l'app, hors périmètre. Ces classes littérales (jamais interpolées via template
 * literal, cf. règle Tailwind v4 : le scanner lit le texte source tel quel) donnent aux
 * deux landings la vraie couleur de marque SilkyPlace, indépendamment de ces tokens.
 */
export const SP_TEXT = 'text-[#520C0C]'
export const SP_BG = 'bg-[#520C0C]'
export const SP_BORDER = 'border-[#520C0C]'
export const SP_RING = 'ring-[#520C0C]'
export const SP_ON_PRIMARY_TEXT = 'text-[#DDE6EF]'
export const SP_SAGE_TEXT = 'text-[#5F6B4C]'
export const SP_SAGE_BG = 'bg-[#A9B08F]'

/**
 * Le composant <Button> partagé (variant="default") vient de src/components/ui/button.tsx
 * et code en dur bg-primary/text-primary-foreground — donc lui aussi hérité du token
 * --primary encore "Relia". On ne touche pas ce composant partagé (utilisé par toute
 * l'app connectée, hors périmètre) : on surcharge juste la couleur au niveau de chaque
 * bouton de la landing via className. `cn()` (le twMerge de shadcn) dédoublonne
 * correctement bg-primary/bg-[#520C0C] au profit du dernier, donc cette surcharge
 * fonctionne de façon fiable.
 */
export const SP_BUTTON = 'bg-[#520C0C] text-[#DDE6EF] hover:bg-[#520C0C]/92'
