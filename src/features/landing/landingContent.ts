/**
 * Contenu de la page d'accueil — un seul endroit pour ajuster prix, essai, contact et témoignages.
 * Règle : n'y écrire que ce qui est vrai du produit aujourd'hui (pas de mode hors-ligne, pas de rappels,
 * pas de chiffres d'audience ni de témoignages inventés).
 */

/** Passer à true quand l'abonnement (connexion + paiement) est réellement ouvert : la mention « bientôt » disparaît. */
export const BILLING_LIVE = false

export const TRIAL_DAYS = 14
export const PRICE_MONTHLY = 29
export const PRICE_ANNUAL = 290
/** 12 × 29 € = 348 € ; 290 € par an = 58 € d'économie, soit 2 mois offerts. */
export const ANNUAL_FREE_MONTHS = Math.round((PRICE_MONTHLY * 12 - PRICE_ANNUAL) / PRICE_MONTHLY)

export const CONTACT_EMAIL = 'hello@relia.com'

export interface Testimonial {
  quote: string
  headline: string
  author: string
  role: string
}

/** Vide tant qu'il n'y a pas de vrais avis clients, consentants : la section n'est alors pas affichée. */
export const TESTIMONIALS: Testimonial[] = []

export const PAIN_POINTS = [
  { title: 'Des tâches notées partout', text: 'Mails, notes du téléphone, post-it… et le reste dans ta tête.' },
  { title: '« J’ai oublié les chaises ! »', text: 'On s’en aperçoit la veille au soir, quand il est déjà trop tard.' },
  { title: 'Un budget flou', text: 'Les coûts d’un côté, les devis de l’autre, et ta marge quelque part entre les deux.' },
  { title: '« C’est bien confirmé ? »', text: 'Le statut de chaque prestataire reste un mystère jusqu’au dernier moment.' },
  { title: 'Des appels à 22 h 30', text: '« Sophie, c’est bien confirmé pour demain ? » La veille, quand tu devrais dormir.' },
]

export const SOLUTION_POINTS = [
  {
    title: 'Un seul endroit pour tout orchestrer',
    text: 'Tâches, matériel, prestataires, finances, planning du Jour J. Fini les post-it, les mails perdus et les tableurs qui plantent.',
  },
  {
    title: 'Le Jour J, minute par minute',
    text: 'Qui fait quoi, à quelle heure, où. RELIA repère même les chevauchements de planning avant qu’ils ne t’attrapent.',
  },
  {
    title: 'Une checklist matériel claire',
    text: 'Quantités, statut, dégâts éventuels, destination au retour. Tu sais ce qui est parti et ce qui est revenu.',
  },
  {
    title: 'Des finances toujours à jour',
    text: 'Le budget du couple et ta rentabilité côte à côte : ce qu’il reste à dépenser, ton profit, ta marge.',
  },
  {
    title: 'Tes données restent les tiennes',
    text: 'Aujourd’hui, elles sont stockées dans ton navigateur, sans compte à créer, et tu peux tout exporter à tout moment.',
  },
]

export const FAQ = [
  {
    q: `Le prix est-il justifié ?`,
    a: `RELIA coûte ${PRICE_MONTHLY} € par mois, ou ${PRICE_ANNUAL} € par an (${ANNUAL_FREE_MONTHS} mois offerts). Ce que tu paies : un seul endroit pour tes tâches, ton budget, tes prestataires, tes devis et ton déroulé du Jour J, plutôt que cinq outils à recoller. Nous ne te promettons aucun gain chiffré : le meilleur test, c’est l’essai de ${TRIAL_DAYS} jours, sans carte bancaire.`,
  },
  {
    q: 'En quoi est-ce différent des alternatives gratuites ?',
    a: 'Excel, Notion ou Google Sheets sont excellents, et gratuits. Mais tu dois construire et entretenir toi-même la structure : le suivi de marge par mariage, la numérotation des devis, le déroulé imprimable. RELIA est déjà pensé pour le métier de décoratrice de mariage. Si tu es à l’aise avec ton système actuel et qu’il te suffit, tu n’as peut-être pas besoin de nous.',
  },
  {
    q: 'Combien de temps faut-il pour voir des résultats ?',
    a: 'Le bénéfice le plus rapide est l’ordre : dès que tu as saisi un mariage, tâches, budget, prestataires et Jour J sont réunis au même endroit. Compte un après-midi pour y mettre un mariage en cours, ou quelques minutes pour explorer la démo. Les effets sur ta marge dépendent de ta façon de travailler : nous ne les chiffrons pas.',
  },
  {
    q: 'Est-ce difficile à utiliser ? Faut-il des compétences techniques ?',
    a: 'Non. Il n’y a rien à installer ni à paramétrer : tu crées ton espace, tu ajoutes un mariage, tu avances. Si tu sais utiliser un tableur ou un agenda, tu sais utiliser RELIA. La démo te permet de tout voir avec des données fictives avant de commencer.',
  },
  {
    q: 'Où sont stockées mes données ?',
    a: 'Aujourd’hui, dans ton navigateur, sur ton appareil : rien n’est envoyé sur un serveur. Tu peux tout exporter et importer en JSON depuis les Paramètres. Une sauvegarde en ligne est en préparation ; quand elle arrivera, tu en seras informée et l’export restera disponible.',
  },
  {
    q: 'Est-ce que ça marche sans internet ?',
    a: 'RELIA a besoin d’une connexion pour s’ouvrir : il n’y a pas encore de mode hors-ligne complet. Bon réflexe, la veille : imprime ou enregistre en PDF ton déroulé du Jour J (bouton « Imprimer / Exporter »). Tu l’as alors avec toi, même sans réseau.',
  },
  {
    q: 'Mon client a-t-il accès à RELIA ?',
    a: 'Non : RELIA est ton poste de pilotage. Ton client reçoit les devis et factures que tu lui envoies (imprimés ou enregistrés en PDF). Tu gères, il voit ce qu’il doit voir.',
  },
  {
    q: 'Les devis et factures sont-ils conformes ?',
    a: 'RELIA numérote automatiquement tes devis et factures et affiche les coordonnées du client. Ce sont des documents indicatifs : vérifie tes obligations légales et fiscales avant émission.',
  },
]

/** Identité de l'éditeur — à compléter avant l'ouverture au public : ces valeurs alimentent les pages légales. */
export const LEGAL = {
  name: '[NOM OU RAISON SOCIALE — À COMPLÉTER]',
  country: '[PAYS — À COMPLÉTER]',
  address: '[ADRESSE — À COMPLÉTER]',
  siteUrl: '[URL DU SITE — À COMPLÉTER]',
  updatedOn: '20 septembre 2026',
} as const
