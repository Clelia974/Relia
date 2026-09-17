import { Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Racine "/" : landing au tout premier lancement, sinon retour direct au dashboard. */
export function RootGate() {
  const onboarded = useWorkspaceStore((s) => s.workspace.userProfile.onboarded)
  if (onboarded) return <Navigate to="/aujourdhui" replace />
  return <LandingPage />
}
