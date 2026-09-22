# Structure auth/routing — câblée (Étape 1)

`ProtectedRoute` et `AuthenticatedHeader` sont **branchés** dans l'app.
Compte requis (Supabase Auth réel) pour utiliser quoi que ce soit au-delà
de la landing publique et des pages légales.

## État actuel

| Fichier | Statut |
|---|---|
| `src/hooks/useAuth.ts` | Réel — session Supabase (`getSession` + `onAuthStateChange`). |
| `src/hooks/useWorkspaceCheck.ts` | Réel — `hasWorkspace` = `workspace.userProfile.onboarded` (purement local, indépendant du compte — cf. « Décision restée ouverte » plus bas). |
| `src/components/routing/ProtectedRoute.tsx` | **Câblée** — sur `AppLayout` (`requireWorkspace`) et sur `/onboarding` (`requireWorkspace={false}`), dans `src/app/router.tsx`. |
| `src/app/layout/AuthenticatedHeader.tsx` | **Câblée** — montée dans `src/pages/LandingPage.tsx` (pas dans `AppLayout` : ce dernier a déjà sa propre navigation Sidebar/TopNav, l'en-tête authentifié n'a de sens que sur les pages publiques visitées par quelqu'un déjà connecté). |

## Ce que ça change concrètement

- `/` : landing publique toujours accessible ; affiche `AuthenticatedHeader`
  (CTA "Aller à mon application" + menu compte) si connecté·e.
- `/onboarding` : nécessite d'être authentifié·e (sinon → `/`) ; pas
  d'espace requis (c'est justement l'étape qui le crée).
- `/aujourdhui`, `/mariages`, etc. (tout ce qui vit sous `AppLayout`) :
  nécessitent authentification **et** espace onboardé. Non authentifié·e →
  `/`. Authentifié·e sans espace → `/onboarding`.
- Pages légales (`/confidentialite`, `/conditions`, `/remboursement`,
  `/cookies`) : toujours publiques, inchangées.

Conséquence assumée (décision explicite, pas un effet de bord) : la landing
ne peut plus promettre « Aucune inscription » — la copie a été corrigée
dans `LandingPage.tsx` et `landingContent.ts` (« Compte gratuit en 1
minute », « seul ton compte est géré ailleurs »). Le CTA "Commencer
gratuitement" mène maintenant à `/inscription` (pas directement à
`/onboarding`). "Voir une démo" charge toujours les données fictives
localement ; sans compte, ça renvoie vers `/inscription` plutôt que
`/aujourdhui` — les données sont déjà là une fois connecté·e.

## Décision restée ouverte

`hasWorkspace` reste purement local (`userProfile.onboarded` dans le
workspace stocké dans `localStorage`), **pas lié au compte Supabase**. Deux
comptes différents sur le même navigateur partagent donc le même espace de
travail local. Ça deviendra pertinent à trancher avec Étape 2 (sauvegarde
en ligne), pas avant.

## Tests

- `src/app/router.test.tsx` — comportement réel des redirections pour
  chaque combinaison (authentifié·e / pas, espace onboardé / pas), sur
  chaque route concernée.
- `src/pages/LandingPage.test.tsx` — CTA/démo selon l'état d'auth,
  en-tête visible seulement si connecté·e.
- `src/components/routing/ProtectedRoute.test.tsx` — la garde en
  isolation.
- `src/app/layout/AuthenticatedHeader.test.tsx` — le composant en
  isolation.
- `src/hooks/useAuth.test.ts` — contrat de forme (mock module Supabase).

Tous mockent `@/hooks/useAuth` via `vi.mock` (pas de vraie session dans les
tests) — premier pattern de ce type introduit avec `useAuth.ts` (Sprint 2),
repris partout où un composant en dépend transitivement.
