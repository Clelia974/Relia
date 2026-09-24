/**
 * Échoue tout de suite (au chargement du module, avant toute requête) si
 * une variable d'environnement serveur requise est absente — plutôt que
 * de tourner silencieusement avec une clé vide (`?? ''`), ce qui produit
 * des erreurs cryptiques côté Stripe/Supabase ("Invalid API Key") au lieu
 * d'un message clair pointant la vraie cause. Préfixé `_` (comme le
 * dossier) : Vercel ignore les fichiers/dossiers commençant par `_` sous
 * `api/` lors de la détection automatique des routes — jamais déployé
 * comme fonction lui-même.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable d'environnement manquante côté serveur : ${name}`)
  }
  return value
}
