import { ZordiLandingPage } from '@/pages/ZordiLandingPage'
import { LandingPage } from '@/pages/LandingPage'

/**
 * Racine "/" : la page d'accueil publique — le CTA mène à l'app si l'espace est déjà
 * configuré. Routage par nom d'hôte plutôt que par chemin : zordi.evenementscles.com/
 * doit afficher directement la landing Zordi (pas de "/zordi" à taper), pendant que
 * relia.evenementscles.com/ (et tout autre hôte, ex. les previews Vercel) garde la
 * vraie landing Zordi. Le chemin "/zordi" continue aussi de fonctionner sur les deux
 * hôtes — RootGate ne gère que la racine.
 */
export function RootGate() {
  if (typeof window !== 'undefined' && window.location.hostname.startsWith('zordi.')) {
    return <ZordiLandingPage />
  }
  return <LandingPage />
}
