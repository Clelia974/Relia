import { LandingPage } from '@/pages/LandingPage'

/** Racine "/" : toujours la page d'accueil publique — le CTA mène à l'app si l'espace est déjà configuré. */
export function RootGate() {
  return <LandingPage />
}
