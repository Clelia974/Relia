# Étape 1 (Auth) — état d'avancement

## Fait ✅

- **Sprint 1** — client Supabase réel (`src/lib/supabase.ts`), connecté au
  projet `onpvqzewpyedbfnltqif`. Clés dans `.env.local` (gitignoré) ;
  `.env.example` sert de gabarit tracké.
- **Sprint 2** — `src/hooks/useAuth.ts` remplace le mock par une vraie
  session Supabase (`getSession` + `onAuthStateChange`). Testé en isolation
  en mockant `@/lib/supabase` (premier cas de `vi.mock` du repo — `useAuth`
  parle à un service externe, pas d'équivalent "store réel" possible).
- **Sprint 3** — 4 pages (`src/pages/auth/`) : `LoginPage`, `SignupPage`,
  `PasswordResetPage`, `PasswordUpdatePage`. Routes ajoutées dans
  `router.tsx` de façon purement additive :
  `/connexion`, `/inscription`, `/mot-de-passe-oublie`,
  `/nouveau-mot-de-passe` — **routes françaises**, cohérentes avec le reste
  de l'app (`/mariages`, `/parametres`…), pas `/signup`/`/login` en anglais.
  Validation via Zod (`authForm.schema.ts`), pas de `validation.ts` séparé —
  même convention que `vendorForm.schema.ts` ailleurs dans le repo.
  Vérifiées en direct contre le vrai projet Supabase (`getSession()` répond
  correctement depuis `/nouveau-mot-de-passe`).

`ProtectedRoute` et `AuthenticatedHeader` restent **en réserve** (cf.
[`src/components/routing/README.md`](../../components/routing/README.md)) —
rien n'est branché, la landing et le routing actuel n'ont pas changé.

- **Sprint 4** — SQL exécuté (`supabase/sql/001_create_users_table.sql`) :
  `public.users` existe, RLS + trigger `on_auth_user_created` en place.
  Côté app : `userProfile.ts` (lecture typée, snake_case → camelCase) +
  `useUserProfile.ts`, branché dans `OnboardingPage` pour vérifier — sans
  jamais bloquer — que le profil a bien été créé automatiquement par le
  trigger. **Pas d'insertion côté client** : volontaire, il n'existe pas de
  policy INSERT pour `authenticated` (la ligne est créée uniquement par le
  trigger, en `security definer`, indépendant de RLS) — une tentative
  d'écriture ici échouerait. `profile === null` après chargement signale
  une anomalie (trigger qui n'a pas tourné) et va en `console.error`, sans
  jamais bloquer l'onboarding.
- Rien dans l'UI n'affiche encore `trialEndDate`/`subscriptionStatus` — le
  hook existe, prêt pour un futur bandeau d'essai, mais aucune maquette ne
  le demande pour l'instant.

## Après Sprint 4 — câblage (non commencé)

Voir la checklist complète dans
[`src/components/routing/README.md`](../../components/routing/README.md) :
brancher `ProtectedRoute` sur les routes de l'app, monter
`AuthenticatedHeader`, décider du nouveau parcours landing → inscription.
Les tests qui décrivent le comportement actuel (`router.test.tsx`,
`LandingPage.test.tsx`) seront mis à jour à ce moment-là — pas avant, pour
garder la suite toujours verte entre-temps.
