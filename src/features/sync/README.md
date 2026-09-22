# Étape 2 (Cloud Backup) — sync hybride

## Principe

- **localStorage reste la source de vérité, toujours.** La sauvegarde
  cloud est une copie de secours, jamais l'inverse.
- **Push manuel, opt-in** : bouton "Sauvegarder maintenant" dans
  `/parametres` (`useSyncToCloud`). Jamais automatique en continu.
- **Pull automatique, mais seulement pour amorcer un nouvel appareil** :
  au premier passage dans une route protégée, si l'espace local n'a
  jamais été onboardé, tentative de restauration depuis le cloud
  (`useAutoRestoreOnLogin`, appelé depuis `ProtectedRoute`). Ne s'exécute
  **jamais** si un espace local existe déjà — aucun risque d'écraser un
  travail en cours.
- **Vue Jour J : zéro appel réseau, par construction.** Aucun fichier
  sous `src/features/dayof` ou `src/pages/mariages/WeddingDayOfTab.tsx`
  n'importe quoi que ce soit de ce dossier — ce n'est pas une convention
  respectée à la main, c'est structurellement impossible d'y déclencher un
  appel de sync par accident.

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/sql/002_create_workspace_backups_table.sql` | Table `workspace_backups` : `user_id` (clé primaire — upsert correct sans `onConflict`), `data` (jsonb, tout le Workspace sérialisé), `synced_at`, `created_at`. RLS : select/insert/update sur sa propre ligne. |
| `workspaceBackup.ts` | `fetchWorkspaceBackup`/`pushWorkspaceBackup` — lecture validée via `migrateWorkspace` (même garde-fou que l'import de fichier JSON), jamais de confiance aveugle envers les données stockées. |
| `useAutoRestoreOnLogin.ts` | Pull automatique, utilisé par `ProtectedRoute`. Une seule tentative par utilisateur et par chargement de page (singleton module). |
| `useSyncToCloud.ts` | Push manuel, utilisé par `ParametresPage`. |

## Corrections apportées au schéma proposé initialement

Le prompt d'origine proposait une table `weddings` avec `upsert(...,
{ onConflict: 'user_id' })` mais **sans contrainte d'unicité sur
`user_id`** — sans elle, chaque sauvegarde aurait inséré une nouvelle
ligne au lieu de remplacer la précédente, accumulant des doublons
indéfiniment. Ici, `user_id` est directement la clé primaire : une seule
ligne par utilisatrice, upsert correct par construction. Renommée
`workspace_backups` (pas `weddings`) : chaque ligne contient l'espace de
travail complet, pas un mariage individuel.

## Bug corrigé pendant le développement (pas qu'un souci de test)

`useAutoRestoreOnLogin` calculait initialement `isRestoring` avec
`useState(false)`, mis à `true` seulement dans l'effet. Comme
`ProtectedRoute` décide de rediriger vers `/onboarding` de façon
synchrone pendant le rendu, le tout premier rendu (avant que l'effet ne
démarre) redirigeait déjà vers `/onboarding` — démontant le composant et
coupant net la requête de restauration en vol, même quand une sauvegarde
cloud existait bien. Corrigé en calculant l'état initial de façon
paresseuse (`useState(() => ...)`) dès le premier rendu. Un second bug lié
(`hasWorkspace` dans les dépendances de l'effet, qui se relançait à cause
de son propre `replaceWorkspace()` et coupait le `.finally()` avant qu'il
ne repasse `isRestoring` à `false`) a été corrigé en retirant `hasWorkspace`
des dépendances — cf. commentaires dans le fichier.

## Décision volontairement pas prise ici

Pas de résolution de conflit sophistiquée : le push écrase toujours la
version cloud, le pull ne s'exécute que si l'espace local est vide. Deux
appareils utilisés en parallèle sans synchronisation manuelle régulière
peuvent diverger — accepté pour ce MVP (push explicite, à l'utilisatrice
de le faire). Une vraie résolution de conflit (horodatage, fusion) n'est
pas dans ce périmètre.
