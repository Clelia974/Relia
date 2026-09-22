# Structure auth/routing — en réserve pour la Phase 1

Ce dossier (+ `src/hooks/useAuth.ts`, `src/hooks/useWorkspaceCheck.ts`,
`src/app/layout/AuthenticatedHeader.tsx`) contient la structure de routing
protégé préparée en amont de la Phase 1 (Supabase Auth). **Rien n'est
branché aujourd'hui** : `router.tsx`, `AppLayout.tsx` et `LandingPage.tsx`
sont inchangés, et le comportement actuel de l'app reste garanti par les
tests listés plus bas.

## État actuel

| Fichier | Statut |
|---|---|
| `src/hooks/useAuth.ts` | Mock — `isAuthenticated: true` en dur, user placeholder. **Seul fichier à remplacer** par la vraie session Supabase. |
| `src/hooks/useWorkspaceCheck.ts` | Réel — lit `workspace.userProfile.onboarded` sur le store actuel. Pas de mock, fonctionne déjà tel quel. |
| `src/components/routing/LoadingScreen.tsx` | Réel — prêt à l'emploi. |
| `src/components/routing/ProtectedRoute.tsx` | Réel — garde générique (auth + espace onboardé). Pas encore utilisé dans `router.tsx`. |
| `src/app/layout/AuthenticatedHeader.tsx` | Réel — pas encore monté dans `LandingPage.tsx` ni ailleurs. |

## Pourquoi rien n'est branché

`useAuth()` retourne `isAuthenticated: true` pour ne jamais bloquer l'accès
local tant qu'il n'y a pas de vrai compte (cf. commentaire dans
`useAuth.ts`). Si on avait branché `ProtectedRoute`/`AuthenticatedHeader`
dès maintenant avec ce mock, deux choses auraient changé silencieusement
pour tout le monde en local :
- la landing publique (`/`) aurait toujours affiché l'en-tête authentifié
  (puisque `isAuthenticated` est toujours vrai) ;
- toute route de l'app visitée directement sans espace onboardé aurait été
  redirigée vers `/onboarding` — une redirection qui n'existe pas
  aujourd'hui.

On a choisi de garder la structure prête et testée, sans l'activer, pour
que ce choix (câbler maintenant vs. attendre la vraie auth) reste une
décision explicite prise en Phase 1, pas un effet de bord de ce commit.

## Checklist de câblage — Phase 1

À faire **ensemble**, dans une session dédiée, une fois Supabase Auth
disponible :

- [ ] **`useAuth.ts`** : remplacer le corps du mock par la lecture de la
      session Supabase réelle (`supabase.auth.getSession()` +
      `onAuthStateChange` pour `isLoading`/`user`/`isAuthenticated`),
      sans changer la forme du retour (`user`, `isLoading`,
      `isAuthenticated`, `logout`) — `useAuth.test.ts` verrouille ce
      contrat, il doit continuer à passer sans modification.
- [ ] **Décider ce que devient `hasWorkspace`** une fois l'auth réelle en
      place : reste-t-il purement local (`userProfile.onboarded`), ou
      l'espace de travail devient-il lié au compte (donc potentiellement
      absent tant qu'il n'a pas été chargé depuis le backend) ? Ça change
      la définition de `useWorkspaceCheck.isLoading`, actuellement toujours
      `false`.
- [ ] **`router.tsx`** : envelopper le `<Route element={<AppLayout />}>`
      dans `<ProtectedRoute requireWorkspace>`.
- [ ] **`LandingPage.tsx`** (ou son layout) : monter `<AuthenticatedHeader
      />` conditionnellement — ou décider si la landing doit plutôt
      rediriger directement un utilisateur authentifié+onboardé vers
      `/aujourdhui` sans repasser par la landing (à trancher en Phase 1,
      hors scope de cette réserve).
- [ ] **`/onboarding`** : décider si la route doit elle-même passer par
      `ProtectedRoute` (`requireWorkspace={false}`) une fois l'auth réelle
      en place.
- [ ] Une fois câblé, les tests suivants **doivent être mis à jour**
      (ils décrivent volontairement le comportement *actuel*, sans
      branchement — leur échec au moment du câblage est le signal attendu,
      pas une régression) :
      - `src/app/router.test.tsx`
      - `src/pages/LandingPage.test.tsx` (test "n'affiche aucun en-tête
        authentifié…")

## Tests qui garantissent l'état "en réserve" aujourd'hui

- `src/app/router.test.tsx` — `/` reste la landing publique, `/aujourdhui`
  reste atteignable sans espace onboardé (aucune redirection introduite).
- `src/pages/LandingPage.test.tsx` — aucun bouton d'en-tête authentifié
  n'apparaît sur la landing.
- `src/components/routing/ProtectedRoute.test.tsx` — la garde fonctionne
  correctement en isolation (redirection vers `/onboarding`, rendu direct
  si `requireWorkspace={false}`).
- `src/app/layout/AuthenticatedHeader.test.tsx` — le composant fonctionne
  en isolation (CTA, menu compte).
- `src/hooks/useAuth.test.ts` — verrouille la forme du contrat que Phase 1
  doit respecter en remplaçant le mock.
