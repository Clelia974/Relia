# Étape 3 (Paiement) — trial 14j + Stripe + webhooks

## Modèle produit (important, différent du brief initial)

Ce n'est **pas** juste "trial vs payant" : la landing (`LandingPage.tsx`,
section Tarifs) promet déjà un palier **Gratuit permanent** (3 mariages,
sans limite de durée) à côté du **Pro** (29€/mois ou 290€/an, essai 14
jours). Décision explicite prise avec l'utilisatrice :

- **Zéro blocage d'accès** après l'essai — jamais coupée de l'app,
  nulle part. Après le trial (+ 48h de grâce), badge "Version Gratuite" +
  invitation à passer au Pro.
- **Sauf la création de mariages** : limite dure à 3 pour la Version
  Gratuite (`expired`/`cancelled`) — cf. section dédiée plus bas. Seule
  restriction réelle du palier Gratuit, tout le reste de l'app reste
  utilisable sans limite.

## Fichiers

| Fichier | Rôle |
|---|---|
| `subscriptionAccess.ts` | Logique pure : `trial` → `grace` (48h après la fin du trial) → `expired`, ou `active`/`cancelled`. `hasAccess` calculé mais **non consommé** par `ProtectedRoute` (zéro blocage, cf. plus haut) — prêt pour un futur chantier de blocage réel si la décision change. |
| `useSubscriptionCheck.ts` | Hook, réutilise `useUserProfile` (Étape 1). |
| `useStripeCheckout.ts` | Crée la session côté serveur puis redirige (`window.location.href`) vers Stripe Hosted Checkout — pas de `@stripe/stripe-js`, pas de formulaire embarqué. |
| `components/SubscriptionStatusBadge.tsx` | Badge de statut, même convention que les autres badges de l'app (ton + libellé). |
| `src/pages/PaymentPage.tsx` (`/paiement`) | Statut + bascule mensuel/annuel + CTA. Gère `?paiement=succes\|annule` (redirection Stripe) via toast, puis nettoie l'URL. |
| `api/stripe/checkout-session.ts` | Fonction serveur (Vercel) — liste blanche des `priceId` acceptés, ne fait jamais confiance à ce qu'envoie le client. |
| `api/stripe/webhook.ts` | Fonction serveur — signature Stripe vérifiée, met à jour `public.users` via la clé `service_role` (contourne RLS, jamais utilisée ailleurs). |
| `supabase/sql/003_add_stripe_customer_id.sql` | `stripe_customer_id` sur `public.users` — cf. bug corrigé ci-dessous. |

## Bug corrigé par rapport au prompt initial

Le webhook proposé lisait `subscription.client_reference_id` et
`invoice.client_reference_id` — **ce champ n'existe pas** sur les objets
`Subscription`/`Invoice` de Stripe (seulement sur `Checkout.Session`).
Tel quel, `customer.subscription.deleted` n'aurait jamais pu retrouver
l'utilisateur à annuler. Corrigé en stockant `stripe_customer_id` sur
`public.users` au moment du `checkout.session.completed`, puis en
retrouvant l'utilisateur par ce champ pour les événements suivants (qui ne
portent que le `customer`, jamais notre `user_id` Supabase).

## Vue Jour J : zéro appel réseau, par construction

Aucun fichier sous `src/features/dayof`/`WeddingDayOfTab.tsx` n'importe
quoi que ce soit de `src/features/payment` — structurellement impossible
d'y déclencher un appel Stripe par accident, même si le blocage était
activé un jour.

## Étapes manuelles — faites ✅

SQL (001, 002, 003) exécuté, `SUPABASE_SERVICE_ROLE_KEY` récupérée et
posée (locale + Vercel), variables Vercel en place, redéployé et vérifié
en prod (bundle à jour, `/api/stripe/checkout-session` répond 405 sur
GET). À confirmer de ton côté : que le webhook Stripe pointe bien vers
`https://relia-app.vercel.app/api/stripe/webhook` avec les événements
`checkout.session.completed` et `customer.subscription.deleted`.

## Limite Gratuit — 3 mariages (Étape 4)

| Fichier | Rôle |
|---|---|
| `weddingLimit.ts` | Logique pure : illimité pour `trial`/`grace`/`active` (et statut pas encore résolu — jamais bloquer par défaut), limité à 3 pour `expired`/`cancelled`. |
| `useWeddingLimit.ts` | Hook, combine `useSubscriptionCheck` + `workspace.weddings.length`. |
| `components/WeddingLimitDialog.tsx` | `AlertDialog` (même convention que les autres confirmations de l'app) — jamais de blocage sans échappatoire, "Annuler" toujours présent. |

Deux points d'application, l'un suffit en usage normal, l'autre est un
filet de sécurité :
- `MariagesListPage.tsx` : le bouton "Créer un mariage" ouvre le
  dialogue au lieu de naviguer si la limite est atteinte.
- `NewWeddingPage.tsx` : si on arrive directement sur `/mariages/nouveau`
  par URL alors que la limite est atteinte, affiche un état bloqué (avec
  liens de sortie) au lieu du formulaire.

Vérifiée uniquement à la création — jamais consultée pour un mariage déjà
créé, donc aucun impact possible sur la Vue Jour J.

## Limite de test locale

`npm run dev` (Vite) ne sait pas exécuter `api/*.ts` — ces fonctions ne
tournent que sur Vercel (déployé, ou via `vercel dev` si besoin de tester
en local). Le bouton "Passer au Pro" appellera `/api/stripe/checkout-session`
qui n'existe pas en `npm run dev` local ; à tester une fois déployé.
