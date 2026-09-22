# Étape 3 (Paiement) — trial 14j + Stripe + webhooks

## Modèle produit (important, différent du brief initial)

Ce n'est **pas** juste "trial vs payant" : la landing (`LandingPage.tsx`,
section Tarifs) promet déjà un palier **Gratuit permanent** (3 mariages,
sans limite de durée) à côté du **Pro** (29€/mois ou 290€/an, essai 14
jours). Décision explicite prise avec l'utilisatrice :

- **Zéro blocage** après l'essai — jamais d'accès coupé, nulle part.
- Après le trial (+ 48h de grâce), affichage informatif seulement :
  badge "Version Gratuite" + invitation à passer au Pro.
- La limite réelle de 3 mariages (palier Gratuit) **n'est pas
  implémentée** — rien dans le code ne la fait respecter aujourd'hui.
  Chantier séparé, à faire consciemment plus tard (compter les mariages,
  bloquer la création du 4e...).

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

## Étapes manuelles restantes (côté toi, pas moi)

- [ ] **SQL** : exécuter `supabase/sql/003_add_stripe_customer_id.sql`
      dans Supabase SQL Editor (`001` et `002` déjà faits).
- [ ] **`SUPABASE_SERVICE_ROLE_KEY`** : à récupérer dans Supabase →
      Settings → API → clé `service_role` (secrète, distincte de la clé
      publique déjà utilisée) — nécessaire pour que le webhook puisse
      écrire dans `public.users`. Pas encore dans `.env.local`.
- [ ] **Variables d'environnement Vercel** (Production, et Preview si
      besoin) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `SUPABASE_SERVICE_ROLE_KEY` — **jamais préfixées `VITE_`**, sinon
      elles finiraient dans le bundle client. Puis `VITE_STRIPE_*` comme
      pour Supabase.
- [ ] **Webhook Stripe** : Stripe Dashboard → Developers → Webhooks →
      Add endpoint → `https://relia-app.vercel.app/api/stripe/webhook`,
      événements `checkout.session.completed` et
      `customer.subscription.deleted`. (Le `STRIPE_WEBHOOK_SECRET` déjà
      fourni suggère que c'est peut-être déjà fait — à vérifier que
      l'URL de destination est correcte.)
- [ ] Redéployer une fois les variables Vercel en place (comme pour
      Supabase — un `git push` seul ne suffit pas si les variables
      n'existaient pas au moment du build).

## Limite de test locale

`npm run dev` (Vite) ne sait pas exécuter `api/*.ts` — ces fonctions ne
tournent que sur Vercel (déployé, ou via `vercel dev` si besoin de tester
en local). Le bouton "Passer au Pro" appellera `/api/stripe/checkout-session`
qui n'existe pas en `npm run dev` local ; à tester une fois déployé.
