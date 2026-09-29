/**
 * Couleurs de marque Zordi pour les pages publiques (LandingPage + ZordiLandingPage).
 *
 * Pourquoi pas les tokens --primary / --thread : ces variables globales (src/index.css)
 * sont encore celles de l'ancien design system "Relia — Calme & Luxe" (#6B1F23, #75561A)
 * et pilotent toute l'app connectée (sidebar, boutons, etc.) — les changer ici changerait
 * toute l'app, hors périmètre. Ces classes littérales (jamais interpolées via template
 * literal, cf. règle Tailwind v4 : le scanner lit le texte source tel quel) donnent aux
 * deux landings la vraie couleur de marque Zordi, indépendamment de ces tokens.
 */
export const Z_TEXT = 'text-[#680808]'
export const Z_BG = 'bg-[#680808]'
export const Z_BORDER = 'border-[#680808]'
export const Z_RING = 'ring-[#680808]'
export const Z_ON_PRIMARY_TEXT = 'text-[#DDE6EF]'
export const Z_SAGE_TEXT = 'text-[#5F6B4C]'
export const Z_SAGE_BG = 'bg-[#A9B08F]'

/**
 * Le composant <Button> partagé (variant="default") vient de src/components/ui/button.tsx
 * et code en dur bg-primary/text-primary-foreground — donc lui aussi hérité du token
 * --primary encore "Relia". On ne touche pas ce composant partagé (utilisé par toute
 * l'app connectée, hors périmètre) : on surcharge juste la couleur au niveau de chaque
 * bouton de la landing via className. `cn()` (le twMerge de shadcn) dédoublonne
 * correctement bg-primary/bg-[#680808] au profit du dernier, donc cette surcharge
 * fonctionne de façon fiable.
 */
export const Z_BUTTON = 'bg-[#680808] text-[#DDE6EF] hover:bg-[#680808]/92'
