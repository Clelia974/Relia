import { JorduLandingPage } from '@/pages/JorduLandingPage'
import { LandingPage } from '@/pages/LandingPage'

/**
 * Racine "/" : la page d'accueil publique — le CTA mène à l'app si l'espace est déjà
 * configuré. Routage par nom d'hôte plutôt que par chemin : jordu.evenementscles.com/
 * doit afficher directement la landing Jordu (pas de "/jordu" à taper), pendant que
 * relia.evenementscles.com/ (et tout autre hôte, ex. les previews Vercel) garde la
 * vraie landing Jordu. Le chemin "/jordu" continue aussi de fonctionner sur les deux
 * hôtes — RootGate ne gère que la racine.
 */
export function RootGate() {
  if (typeof window !== 'undefined' && window.location.hostname.startsWith('jordu.')) {
    return <JorduLandingPage />
  }
  return <LandingPage />
}
