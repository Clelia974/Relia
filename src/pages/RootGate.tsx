import { LandingPage } from '@/pages/LandingPage'

/**
 * Racine "/" : la page d'accueil publique — le CTA mène à l'app si l'espace est déjà
 * configuré. zordi.evenementscles.com/ sert désormais la vraie landing + l'app
 * (stratégie confirmée : un seul domaine à terme, zordi.evenementscles.com devient
 * l'adresse définitive — relia.evenementscles.com reste un alias qui fonctionne à
 * l'identique tant qu'il n'est pas retiré). La landing "liste d'attente" reste
 * disponible sur le chemin "/zordi", sur les deux hôtes — RootGate ne gère que la racine.
 */
export function RootGate() {
  return <LandingPage />
}
