import { useEffect } from 'react'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Notification discrète si les données LocalStorage étaient invalides au chargement. */
export function HydrationNotice() {
  const hydrationIssue = useWorkspaceStore((s) => s.hydrationIssue)
  const clearHydrationIssue = useWorkspaceStore((s) => s.clearHydrationIssue)

  useEffect(() => {
    if (hydrationIssue) {
      toast.warning(hydrationIssue)
      clearHydrationIssue()
    }
  }, [hydrationIssue, clearHydrationIssue])

  return null
}
