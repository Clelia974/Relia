/**
 * Contenu de la page d'accueil — un seul endroit pour ajuster prix, essai, contact et témoignages.
 * Règle : n'y écrire que ce qui est vrai du produit aujourd'hui (pas de mode hors-ligne, pas de rappels,
 * pas de chiffres d'audience ni de témoignages inventés).
 */

/** Le paiement (Stripe Checkout) est réellement ouvert depuis l'Étape 3 : la mention « bientôt » disparaît de la landing. */
export const BILLING_LIVE = true

/** Essai gratuit sans carte pour tout le monde. Doit rester égal au défaut de public.users.trial_end_date (cf. supabase/sql/017_trial_30_days.sql). */
export const TRIAL_DAYS = 30
export const PRICE_MONTHLY = 39
export const PRICE_ANNUAL = 390
/** 12 × 39 € = 468 € ; 390 € par an = 78 € d'économie, soit 2 mois offerts. */
export const ANNUAL_FREE_MONTHS = Math.round((PRICE_MONTHLY * 12 - PRICE_ANNUAL) / PRICE_MONTHLY)

/**
 * Offre de lancement (100 premières clientes) — 1 mois offert puis tarif
 * verrouillé sur l'ANCIEN prix (29 €/mois, 290 €/an), sur des prices
 * Stripe dédiés (`VITE_STRIPE_PRICE_LAUNCH_OFFER`,
 * `VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL`) : si PRICE_MONTHLY/PRICE_ANNUAL
 * augmentent plus tard, ces clientes ne sont pas affectées. Le nombre de
 * places prises vient toujours de `api/launch-offer-count.ts` (compteur
 * réel côté serveur) — cette constante n'est que la limite, jamais un
 * nombre "restant" affiché tel quel.
 */
export const LAUNCH_OFFER_LIMIT = 100
export const LAUNCH_OFFER_FREE_MONTHS = 1
export const LAUNCH_OFFER_PRICE_MONTHLY = 29
export const LAUNCH_OFFER_PRICE_ANNUAL = 290
export const LAUNCH_OFFER_ANNUAL_FREE_MONTHS = Math.round(
  (LAUNCH_OFFER_PRICE_MONTHLY * 12 - LAUNCH_OFFER_PRICE_ANNUAL) / LAUNCH_OFFER_PRICE_MONTHLY,
)

/**
 * Listes reprises telles quelles par la landing (Tarifs) et la page
 * Abonnement (/paiement) — une seule source pour rester cohérent entre
 * les deux. "Sauvegarde en ligne" n'est pas listée : elle est disponible
 * aussi en Gratuit, donc ce n'est pas un avantage réservé à Solo.
 */
export const GRATUIT_FEATURES = [
  '3 mariages',
  'Tâches, planning, prestataires et matériel',
  'Plan de salle et plan de table',
  '1 moodboard par mariage',
  'Export de tes données en JSON',
]
export const PRO_FEATURES = [
  'Mariages illimités',
  'Moodboards illimités',
  'Devis et factures indicatifs',
  'Finances et rentabilité',
  'Bilan post-mariage',
  'Support prioritaire',
]

export const CONTACT_EMAIL = 'contact@evenementscles.com'

export interface Testimonial {
  quote: string
  headline: string
  author: string
  role: string
}

/** Vide tant qu'il n'y a pas de vrais avis clients, consentants : la section n'est alors pas affichée. */
export const TESTIMONIALS: Testimonial[] = []

/** 4 moments reconnaissables, chacun avec sa question et ses lignes — reprend "Tu connais déjà ces moments" telle qu'écrite par Clélia. */
export const PAIN_MOMENTS = [
  {
    quote: '« J’ai noté ça où déjà ? »',
    lines: ['Une information dans WhatsApp.', 'Une autre dans tes mails.', 'Une note dans ton téléphone.', 'Un post-it sur ton bureau.', 'Et le reste… dans ta mémoire.'],
  },
  {
    quote: '« Il manque quoi pour demain ? »',
    lines: ['Tu regardes ton matériel.', 'Tu vérifies tes listes.', 'Tu essaies de te souvenir de ce qui est déjà chargé.', 'Puis tu vérifies encore.'],
  },
  {
    quote: '« C’est bien confirmé ? »',
    lines: ['Quel prestataire arrive à quelle heure ?', 'Qui a confirmé ?', 'Qui doit encore répondre ?', 'Qui doit être payé ?'],
  },
  {
    quote: '« Où j’en suis sur ce mariage ? »',
    lines: ['Le budget est dans un fichier.', 'Les dépenses ailleurs.', 'Les devis dans les mails.', 'Les tâches dans un carnet.', 'Et ta marge quelque part entre les deux.'],
  },
]



/** "Avant / Avec SilkyPlace" — 3 groupes de chaque côté, mêmes verbes qui structurent la comparaison. */
export const BEFORE_GROUPS = [
  { verb: 'Tu cherches.', items: ['Des mails.', 'Des messages.', 'Des notes.', 'Des fichiers.', 'Des post-it.', 'Ta mémoire.'] },
  { verb: 'Tu vérifies.', items: ['Les prestataires.', 'Le matériel.', 'Les horaires.', 'Les paiements.'] },
  { verb: 'Tu recommences.', items: ['À chercher.', 'À vérifier.', 'À te demander si tu n’as rien oublié.'] },
]
export const AFTER_GROUPS = [
  { verb: 'Tu vois.', items: ['Tes tâches.', 'Tes mariages.', 'Ton planning.', 'Tes prestataires.'] },
  { verb: 'Tu sais.', items: ['Ce qui est fait.', 'Ce qui reste à faire.', 'Ce qui doit être confirmé.', 'Ce qui doit être payé.'] },
  { verb: 'Tu avances.', items: ['Sans devoir tout garder dans ta tête.'] },
]

export const FAQ = [
  {
    q: 'Est-ce difficile à utiliser ?',
    a: 'Non. SilkyPlace est pensé pour être utilisé au quotidien par des professionnels de la décoration, sans compétences techniques particulières. Il n’y a rien à installer ni à paramétrer : tu crées ton espace, tu ajoutes un mariage, tu avances.',
  },
  {
    q: 'Est-ce que je peux importer mes anciens mariages ?',
    a: 'Oui. Si tes données sont déjà dans Excel, tu peux les importer dans SilkyPlace. Tu évites ainsi de recommencer toute ta saisie.',
  },
  {
    q: 'Est-ce que je peux commencer sans payer ?',
    a: `Oui. Tu peux commencer gratuitement et tester les fonctionnalités Solo pendant ${TRIAL_DAYS} jours, sans carte bancaire. Après l’essai, tu peux rester sur l’offre gratuite jusqu’à 3 mariages ou passer à Solo.`,
  },
  {
    q: 'Est-ce que je peux utiliser SilkyPlace sans internet ?',
    a: 'SilkyPlace a besoin d’une connexion pour s’ouvrir : il n’y a pas encore de mode hors-ligne complet. Bon réflexe, la veille : imprime ou enregistre en PDF ton déroulé du Jour J (bouton « Imprimer / Exporter »). Tu l’as alors avec toi, même sans réseau.',
  },
  {
    q: 'Où sont stockées mes données ?',
    a: 'Aujourd’hui, tes données de travail (mariages, tâches, prestataires, finances) sont stockées dans ton navigateur, sur ton appareil. Ton compte — email et mot de passe — est géré séparément, par notre prestataire d’authentification. Depuis les Paramètres, un bouton « Sauvegarder maintenant » envoie une copie en ligne à la demande, et tu peux exporter tes données à tout moment.',
  },
  {
    q: 'Mes clientes ont-elles accès à SilkyPlace ?',
    a: 'Non. SilkyPlace est ton espace de gestion. Tes clientes n’ont pas besoin d’avoir un compte pour que tu utilises l’outil — elles reçoivent les devis et factures que tu leur envoies.',
  },
  {
    q: 'Les devis et factures sont-ils conformes ?',
    a: 'Les documents générés par SilkyPlace sont indicatifs. Ils ne remplacent pas tes obligations légales et comptables : vérifie toujours les obligations applicables à ton activité avant émission.',
  },
  {
    q: 'Et si je ne veux pas continuer après l’essai ?',
    a: 'Aucun problème. Tu peux rester sur l’offre gratuite jusqu’à 3 mariages, ou passer à Solo si tu veux continuer avec les fonctionnalités avancées.',
  },
]

/** Identité de l'éditeur — à compléter avant l'ouverture au public : ces valeurs alimentent les pages légales. */
export const LEGAL = {
  name: 'EI Clélia Blard — Evenements Clés',
  country: 'France',
  address: '15 Impasse François Saint-Amand, 97430, La Réunion',
  siteUrl: 'https://silkyplace.evenementscles.com',
  updatedOn: '20 septembre 2026',
} as const
