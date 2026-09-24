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

## Portail client Stripe (gestion de l'abonnement)

Manquait jusqu'ici : une cliente abonnée ne pouvait ni changer sa carte,
ni télécharger une facture, ni résilier elle-même — tout serait passé par
un email au support. Le portail de facturation Stripe (page hébergée par
Stripe, pas de formulaire construit ici) couvre les trois.

| Fichier | Rôle |
|---|---|
| `api/stripe/portal-session.ts` | Fonction serveur — crée la session de portail pour le `stripe_customer_id` du compte authentifié. |
| `useStripeCustomerPortal.ts` | Hook, même principe que `useStripeCheckout.ts` (redirection, pas d'iframe). |
| `src/pages/PaymentPage.tsx` | Carte « Gérer mon abonnement », visible seulement si `status` est `active` ou `cancelled` — avant ça, aucun `stripe_customer_id` n'existe encore. |

**Vérification d'identité côté serveur, jamais côté client** : contrairement
à `checkout-session.ts` (qui accepte un `userId` envoyé par le client,
suffisant pour *démarrer* un abonnement au nom de l'email fourni),
`portal-session.ts` vérifie le jeton d'accès Supabase envoyé en en-tête
`Authorization` et en déduit lui-même l'utilisateur. Nécessaire ici parce
que ce portail donne accès à des moyens de paiement et un historique de
facturation déjà existants — accepter un `userId` du corps de la requête
aurait permis à n'importe qui d'ouvrir le portail de facturation de
n'importe quel autre compte en changeant cette seule valeur.

Même limite de test locale que `checkout-session.ts` ci-dessus (`api/*.ts`
ne tourne pas sous `npm run dev`) — testé via les tests unitaires
(`api/stripe/portal-session.test.ts`, `useStripeCustomerPortal.test.ts`),
à vérifier en conditions réelles une fois déployé.

## Offre de lancement (100 premières clientes)

1 mois offert puis tarif verrouillé, tant que le nombre de places prises
affiché reste un vrai compteur — jamais un chiffre codé en dur, cohérent
avec la règle "sans preuve sociale, sans chiffre inventé" du reste de la
landing.

| Fichier | Rôle |
|---|---|
| `api/launch-offer-count.ts` | Point d'accès public (aucune authentification — appelé depuis la landing, visitée sans compte) : compte `public.users` où `is_launch_offer = true`, renvoie `{ limit, redeemed, remaining, available }`. Jamais de ligne individuelle exposée. |
| `useLaunchOfferAvailability.ts` | Hook client, utilisé par la landing et `/paiement`. `offer` reste `null` tant que l'appel n'a pas abouti (jamais de place affichée par défaut). |
| `api/stripe/checkout-session.ts` | Pour les prices de l'offre (`VITE_STRIPE_PRICE_LAUNCH_OFFER` mensuel, `VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL` annuel) : recompte les places prises au moment de la création de la session (jamais seulement confiance dans l'affichage front, qui peut être vieux de quelques secondes — cache CDN de 30s sur le compteur), pose `subscription_data.trial_period_days = 30` (le vrai mois offert, pas juste une mention) et `metadata.offer = 'launch_100'`. Les deux prices partagent le même compteur/la même limite de 100. |
| `api/stripe/webhook.ts` | `checkout.session.completed` : si `metadata.offer === 'launch_100'`, pose `is_launch_offer = true` sur `public.users` — c'est ce champ, jamais le price Stripe courant, qui est compté. |
| `supabase/sql/004_add_launch_offer.sql` | Colonne `is_launch_offer` sur `public.users`. |
| `src/pages/PaymentPage.tsx` | Carte visible seulement si `status` ∈ {trial, grace, expired} (jamais déjà payé) **et** `offer.available` ; a son propre bascule Mensuel/Annuel, sur le même state `billing` que la carte "Passer au Pro". |
| `src/pages/LandingPage.tsx` | Bandeau au-dessus des tarifs, même condition côté affichage — mais le blocage réel est côté serveur, pas ici. |

**Pourquoi des prices Stripe séparés** (`VITE_STRIPE_PRICE_LAUNCH_OFFER(_ANNUAL)`,
distincts de `VITE_STRIPE_PRICE_SOLO_MONTHLY`/`_YEARLY`) plutôt qu'une
réduction sur le prix standard : si le tarif standard augmente un jour,
les clientes de l'offre de lancement doivent rester au prix promis sans
interruption ni resouscription. Des prices dédiés le garantissent
structurellement ; un simple coupon ou une réduction en pourcentage
suivrait le prix standard au contraire.

**Prix verrouillé par l'offre : l'ancien tarif, pas le nouveau.**
`LAUNCH_OFFER_PRICE_MONTHLY`/`LAUNCH_OFFER_PRICE_ANNUAL` (29 €/290 €,
`landingContent.ts`) sont volontairement distincts de `PRICE_MONTHLY`/
`PRICE_ANNUAL` (passés à 39 €/390 € le 2026-09-24) : l'offre a du sens
seulement si elle protège d'une vraie augmentation future.

**Étape manuelle** (comme pour Checkout/Webhook ci-dessus) : créer les
deux prices (mensuel + annuel) dans Stripe Dashboard, les ajouter à
`VITE_STRIPE_PRICE_LAUNCH_OFFER` / `VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL`
(local + Vercel), et exécuter `004_add_launch_offer.sql`. Le tarif
standard (39 €/390 €) suppose aussi que `VITE_STRIPE_PRICE_SOLO_MONTHLY`/
`_YEARLY` pointent vers de nouveaux prices Stripe à ce nouveau montant
(un price Stripe existant ne se modifie pas, il se remplace).
