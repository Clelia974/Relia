import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Workspace } from '@/types/entities'

interface UseWorkspaceCheckResult {
  hasWorkspace: boolean
  isLoading: boolean
  workspace: Workspace
}

/**
 * hasWorkspace reflète l'onboarding réel (`workspace.userProfile.onboarded`)
 * — la même condition que celle déjà utilisée par LandingPage pour choisir
 * la destination du CTA ("Commencer gratuitement" vs "Ouvrir l'application",
 * cf. src/pages/LandingPage.tsx). isLoading reste à `false` : le store est
 * hydraté de manière synchrone depuis localStorage au montage, il n'y a
 * jamais d'état de chargement réseau à attendre ici.
 */
export function useWorkspaceCheck(): UseWorkspaceCheckResult {
  const workspace = useWorkspaceStore((s) => s.workspace)
  return {
    hasWorkspace: workspace.userProfile.onboarded,
    isLoading: false,
    workspace,
  }
}
