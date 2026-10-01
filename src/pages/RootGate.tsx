import { LandingPage } from '@/pages/LandingPage'

/**
 * Racine "/" : la page d'accueil publique — le CTA mène à l'app si l'espace est déjà
 * configuré. Un seul domaine : silkyplace.evenementscles.com — les anciens hôtes
 * (relia., zordi., jordu.) sont redirigés en 308 vers lui par vercel.json. La landing
 * "liste d'attente" est sur "/liste-attente" — RootGate ne gère que la racine.
 */
export function RootGate() {
  return <LandingPage />
}
