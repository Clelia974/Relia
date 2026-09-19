/** Formateur EUR partagé par toute l'app — un seul endroit pour l'arrondi (0 décimale) et le style. */
export const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/** Variante sans signe — pour les montants toujours affichés positifs (ex. coûts dans ScopeChangeCard). */
export const currencyAbsolute = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  signDisplay: 'never',
})
